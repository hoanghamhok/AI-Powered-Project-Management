import os
import pandas as pd
import psycopg2
from dotenv import load_dotenv
import numpy as np

load_dotenv(dotenv_path="../.env")

def get_db_connection():
    db_url = os.getenv("DATABASE_URL")
    if db_url and "?schema=" in db_url:
        db_url = db_url.split("?")[0]
    return psycopg2.connect(db_url)

def extract_features():
    # We fetch tasks that are completed to use as historical training data
    # The 'completedAt' acts as our "snapshot time" for the features
    query = """
    WITH TaskStats AS (
        SELECT
            t.id AS task_id,
            t.created_at,
            t."dueDate",
            t."completedAt",
            t."estimateHours",
            t.difficulty,
            COALESCE(LENGTH(t.description), 0) AS desc_length,
            -- Snapshot Features (relative to completion time)
            EXTRACT(EPOCH FROM (t."completedAt" - t.created_at)) / 3600 AS task_age,
            CASE
                WHEN t."dueDate" IS NOT NULL THEN EXTRACT(EPOCH FROM (t."dueDate" - t."completedAt")) / 3600
                ELSE 168 -- Default 1 week if no due date
            END AS time_to_due,
            -- Block Features
            (SELECT COUNT(*) FROM "TaskBlock" tb WHERE tb."taskId" = t.id AND tb."blockedAt" <= t."completedAt") AS block_count,
            (SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(tb."unblockedAt", t."completedAt") - tb."blockedAt")) / 3600), 0)
             FROM "TaskBlock" tb WHERE tb."taskId" = t.id AND tb."blockedAt" <= t."completedAt") AS total_blocked_hours,
            -- Workflow Features
            (SELECT COUNT(*) FROM "ActivityLog" al WHERE al."entityId" = t.id AND al.action = 'TASK_MOVED' AND al."createdAt" <= t."completedAt") AS column_change_count,
            (SELECT EXTRACT(EPOCH FROM (t."completedAt" - COALESCE(MAX(al."createdAt"), t.created_at))) / 3600
             FROM "ActivityLog" al WHERE al."entityId" = t.id AND al.action = 'TASK_MOVED' AND al."createdAt" <= t."completedAt") AS time_in_current_column,
            -- Dependency Features
            (SELECT COUNT(*) FROM "TaskDependency" td WHERE td."taskId" = t.id AND td."createdAt" <= t."completedAt") AS dependency_count,
            (SELECT COUNT(*) FROM "TaskDependency" td
             JOIN "Task" dep ON td."dependsOnTaskId" = dep.id
             WHERE td."taskId" = t.id AND td."createdAt" <= t."completedAt" AND (dep."completedAt" IS NULL OR dep."completedAt" > t."completedAt")) AS unresolved_dependencies,
            -- Assignee & Workload
            (SELECT COUNT(*) FROM "TaskAssignee" ta WHERE ta."taskId" = t.id) AS assignee_count,
            (
                SELECT COUNT(*) 
                FROM "TaskAssignee" ta2
                JOIN "Task" t2 ON ta2."taskId" = t2.id
                WHERE ta2."userId" IN (SELECT "userId" FROM "TaskAssignee" WHERE "taskId" = t.id)
                  AND (t2."completedAt" IS NULL OR t2."completedAt" > t."completedAt")
                  AND t2.created_at <= t."completedAt"
                  AND t2."projectId" = t."projectId"
            ) AS assignee_workload,
            -- Comment & Activity
            (SELECT COUNT(*) FROM "Comment" c WHERE c."taskId" = t.id AND c."createdAt" <= t."completedAt") AS comment_count
        FROM "Task" t
        WHERE t."completedAt" IS NOT NULL
    )
    SELECT * FROM TaskStats;
    """
    
    try:
        conn = get_db_connection()
        df = pd.read_sql(query, conn)
        conn.close()
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return

    if df.empty:
        print("No completed tasks found in the database.")
        return

    # 1. Fill missing values
    df['estimateHours'] = df['estimateHours'].fillna(8)
    df['difficulty'] = df['difficulty'].fillna(2)
    
    # 2. Derived features (used in training and inference)
    df['is_overdue'] = (df['time_to_due'] < 0).astype(int)
    df['progress_ratio'] = df['task_age'] / (df['task_age'] + df['time_to_due'].abs() + 0.001)
    df['blocked_ratio'] = df['total_blocked_hours'] / (df['task_age'] + 1)
    
    # ---------------------------------------------------------
    # MULTI-CLASS LABEL GENERATION (SCORE-BASED)
    # ---------------------------------------------------------
    # Outcome signals
    completed_late = (df['time_to_due'] < 0)
    
    def calculate_risk_score(row):
        # Set seed for reproducibility during label generation
        np.random.seed(int(row.name) % 2**32)
        
        score = 0
        # Deadline pressure should predict risk before the task is already late.
        if row['time_to_due'] < 0: score += 4
        elif row['time_to_due'] <= 4: score += 3
        elif row['time_to_due'] <= 12: score += 2
        elif row['time_to_due'] <= 24: score += 1
        
        # Process signals (Blocks)
        if row['total_blocked_hours'] > 48: score += 3
        elif row['total_blocked_hours'] > 12: score += 2
        elif row['total_blocked_hours'] > 0: score += 1
        if row['blocked_ratio'] > 0.4: score += 2
        
        # Stability signals (Churn)
        if row['column_change_count'] >= 8: score += 2
        elif row['column_change_count'] >= 4: score += 1
        
        # Dependency signals
        if row['unresolved_dependencies'] >= 3: score += 3
        elif row['unresolved_dependencies'] >= 1: score += 1
        
        # Workload signals
        if row['assignee_workload'] > 50: score += 3
        elif row['assignee_workload'] > 35: score += 2
        elif row['assignee_workload'] > 20: score += 1
        
        # Efficiency Outcome
        if row['estimateHours'] > 0:
            efficiency = row['task_age'] / row['estimateHours']
            if efficiency > 2.5: score += 2
            elif efficiency > 1.5: score += 1

        # Complexity/Clarity signals. Product difficulty is 1-3, so 3 is high.
        if row['difficulty'] >= 3:
            if row['desc_length'] < 50: score += 1
            if row['comment_count'] < 2: score += 1
        
        # Add a small amount of random variance
        score += np.random.choice([-1, 0, 1], p=[0.1, 0.8, 0.1])
            
        return max(0, score)

    df['label_score'] = df.apply(calculate_risk_score, axis=1)
    
    # Granular thresholds
    # LOW: 0-2, MEDIUM: 3-6, HIGH: >= 7
    def map_risk_level(score):
        if score <= 2: return 0 # LOW
        if score <= 6: return 1 # MEDIUM
        return 2 # HIGH

    df['risk_level_label'] = df['label_score'].apply(map_risk_level)
    
    # Define columns to keep for training (NO raw completedAt)
    features = [
        'task_age', 'time_to_due', 'block_count', 'total_blocked_hours',
        'column_change_count', 'time_in_current_column', 'dependency_count',
        'unresolved_dependencies', 'assignee_count', 'estimateHours',
        'difficulty', 'progress_ratio', 'is_overdue', 'blocked_ratio',
        'comment_count', 'desc_length', 'assignee_workload'
    ]
    
    target = ['risk_level_label', 'label_score']
    
    train_df = df[features + target].copy()
    
    # Export real_dataset.csv
    train_df.to_csv("real_dataset.csv", index=False)
    
    print("-" * 30)
    print(f"Features extracted. Total records: {len(train_df)}")
    print("\nRisk Level Distribution (0:LOW, 1:MEDIUM, 2:HIGH):")
    dist = train_df['risk_level_label'].value_counts().sort_index()
    print(dist)
    for level, count in dist.items():
        pct = (count / len(train_df)) * 100
        label = ["LOW", "MEDIUM", "HIGH"][level]
        print(f"  - {label}: {count} ({pct:.1f}%)")
    
    print(f"\nAverage Label Score: {train_df['label_score'].mean():.2f}")
    print("-" * 30)
    
    return train_df

if __name__ == "__main__":
    extract_features()
