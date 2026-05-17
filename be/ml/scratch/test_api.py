import requests
import json

test_cases = [
    # 1. Very Low Risk
    {
        "task_age": 2.0, "time_to_due": 168.0, "block_count": 0, "total_blocked_hours": 0.0,
        "column_change_count": 1, "time_in_current_column": 2.0, "dependency_count": 0,
        "unresolved_dependencies": 0, "assignee_count": 1, "estimateHours": 8.0,
        "difficulty": 1, "progress_ratio": 0.01, "is_overdue": 0, "blocked_ratio": 0.0,
        "comment_count": 5, "desc_length": 500, "assignee_workload": 20
    },
    # 2. Near Deadline but Stable
    {
        "task_age": 40.0, "time_to_due": 8.0, "block_count": 0, "total_blocked_hours": 0.0,
        "column_change_count": 3, "time_in_current_column": 10.0, "dependency_count": 1,
        "unresolved_dependencies": 0, "assignee_count": 1, "estimateHours": 16.0,
        "difficulty": 2, "progress_ratio": 0.83, "is_overdue": 0, "blocked_ratio": 0.0,
        "comment_count": 12, "desc_length": 300, "assignee_workload": 30
    },
    # 3. Dependency Pressure
    {
        "task_age": 24.0, "time_to_due": 48.0, "block_count": 0, "total_blocked_hours": 0.0,
        "column_change_count": 2, "time_in_current_column": 12.0, "dependency_count": 3,
        "unresolved_dependencies": 2, "assignee_count": 1, "estimateHours": 20.0,
        "difficulty": 3, "progress_ratio": 0.33, "is_overdue": 0, "blocked_ratio": 0.0,
        "comment_count": 4, "desc_length": 150, "assignee_workload": 60
    },
    # 4. Assignee Overloaded
    {
        "task_age": 10.0, "time_to_due": 72.0, "block_count": 0, "total_blocked_hours": 0.0,
        "column_change_count": 1, "time_in_current_column": 10.0, "dependency_count": 0,
        "unresolved_dependencies": 0, "assignee_count": 1, "estimateHours": 8.0,
        "difficulty": 2, "progress_ratio": 0.12, "is_overdue": 0, "blocked_ratio": 0.0,
        "comment_count": 2, "desc_length": 100, "assignee_workload": 110
    },
    # 5. Blocked for Long Time
    {
        "task_age": 48.0, "time_to_due": 24.0, "block_count": 2, "total_blocked_hours": 20.0,
        "column_change_count": 2, "time_in_current_column": 20.0, "dependency_count": 1,
        "unresolved_dependencies": 1, "assignee_count": 1, "estimateHours": 16.0,
        "difficulty": 3, "progress_ratio": 0.6, "is_overdue": 0, "blocked_ratio": 0.41,
        "comment_count": 8, "desc_length": 200, "assignee_workload": 75
    },
    # 6. Churn/Workflow Churn
    {
        "task_age": 100.0, "time_to_due": 12.0, "block_count": 1, "total_blocked_hours": 5.0,
        "column_change_count": 10, "time_in_current_column": 5.0, "dependency_count": 0,
        "unresolved_dependencies": 0, "assignee_count": 1, "estimateHours": 40.0,
        "difficulty": 4, "progress_ratio": 0.89, "is_overdue": 0, "blocked_ratio": 0.05,
        "comment_count": 20, "desc_length": 400, "assignee_workload": 80
    },
    # 7. Silent Dangerous Task
    {
        "task_age": 100.0, "time_to_due": 24.0, "block_count": 0, "total_blocked_hours": 0.0,
        "column_change_count": 1, "time_in_current_column": 48.0, "dependency_count": 0,
        "unresolved_dependencies": 0, "assignee_count": 1, "estimateHours": 20.0,
        "difficulty": 5, "progress_ratio": 0.8, "is_overdue": 0, "blocked_ratio": 0.0,
        "comment_count": 0, "desc_length": 20, "assignee_workload": 70
    },
    # 8. Very High Risk
    {
        "task_age": 150.0, "time_to_due": -24.0, "block_count": 5, "total_blocked_hours": 80.0,
        "column_change_count": 10, "time_in_current_column": 40.0, "dependency_count": 4,
        "unresolved_dependencies": 3, "assignee_count": 2, "estimateHours": 80.0,
        "difficulty": 5, "progress_ratio": 0.86, "is_overdue": 1, "blocked_ratio": 0.53,
        "comment_count": 15, "desc_length": 120, "assignee_workload": 150
    }
]

url = "http://localhost:8001/predict"

for i, payload in enumerate(test_cases, 1):
    try:
        response = requests.post(url, json=payload)
        data = response.json()
        print(f"Case {i}: RiskLevel={data.get('riskLevel')}, Score={data.get('riskScore')}")
        print(f"  Probs: {data.get('probabilities')}")
    except Exception as e:
        print(f"Case {i}: Error: {e}")
