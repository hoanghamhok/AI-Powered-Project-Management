import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, 
    f1_score, 
    classification_report, 
    confusion_matrix
)
import joblib
import os
import json

def train_model():
    if not os.path.exists("real_dataset.csv"):
        print("real_dataset.csv not found. Run extract_features.py first.")
        return

    df = pd.read_csv("real_dataset.csv")
    
    # Select features for training
    features = [
        'task_age', 'time_to_due', 'block_count', 'total_blocked_hours',
        'column_change_count', 'time_in_current_column', 'dependency_count',
        'unresolved_dependencies', 'assignee_count', 'estimateHours',
        'difficulty', 'progress_ratio', 'is_overdue', 'blocked_ratio',
        'comment_count', 'desc_length', 'assignee_workload'
    ]
    
    X = df[features]
    y = df['risk_level_label']
    
    # Distribution check
    dist = y.value_counts(normalize=True).sort_index()
    print("\nClass Distribution:")
    for level, pct in dist.items():
        label = ["LOW", "MEDIUM", "HIGH"][int(level)]
        print(f"  - {label}: {pct*100:.1f}%")
        
    if dist.min() < 0.05:
        print("\n[WARNING] Imbalanced classes detected! Some levels have < 5% representation.")

    # Stratified split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # XGBoost Multi-class model
    # We use multi:softprob to get probabilities for each class
    model = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.05,
        objective='multi:softprob',
        num_class=3,
        random_state=42,
        eval_metric='mlogloss'
    )
    
    print("\nTraining XGBoost multi-class classifier...")
    model.fit(X_train, y_train)
    
    # Predictions
    y_pred = model.predict(X_test)
    
    # Evaluation
    acc = accuracy_score(y_test, y_pred)
    f1_macro = f1_score(y_test, y_pred, average='macro')
    f1_weighted = f1_score(y_test, y_pred, average='weighted')
    
    print("\n" + "="*30)
    print("      MODEL EVALUATION")
    print("="*30)
    print(f"Accuracy:        {acc:.4f}")
    print(f"Macro F1 Score:  {f1_macro:.4f}")
    print(f"Weighted F1 Score: {f1_weighted:.4f}")
    
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    print("\nClassification Report:")
    target_names = ['LOW', 'MEDIUM', 'HIGH']
    print(classification_report(y_test, y_pred, target_names=target_names))
    
    # Save artifacts
    joblib.dump(model, "model.pkl")
    joblib.dump(features, "features.pkl")
    
    label_mapping = {0: "LOW", 1: "MEDIUM", 2: "HIGH"}
    with open("label_mapping.json", "w") as f:
        json.dump(label_mapping, f)
        
    print(f"\nArtifacts saved: model.pkl, features.pkl, label_mapping.json")
    
    # Feature Importance
    importance = model.feature_importances_
    fi_df = pd.DataFrame({
        'Feature': features,
        'Importance': importance
    }).sort_values(by='Importance', ascending=False)
    
    fi_df.to_csv("feature_importance.csv", index=False)
    print("Feature importance saved to feature_importance.csv")

if __name__ == "__main__":
    train_model()
