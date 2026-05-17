from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import joblib
import pandas as pd
import numpy as np
import os
import json
from datetime import datetime

app = FastAPI(title="Task Risk Prediction API (Multi-class)")

# Load model and features
MODEL_PATH = "model.pkl"
FEATURES_PATH = "features.pkl"
MAPPING_PATH = "label_mapping.json"
MODEL_LOAD_TIME = datetime.utcnow().isoformat()

def load_artifacts():
    try:
        model = joblib.load(MODEL_PATH) if os.path.exists(MODEL_PATH) else None
        features = joblib.load(FEATURES_PATH) if os.path.exists(FEATURES_PATH) else None
        mapping = {}
        if os.path.exists(MAPPING_PATH):
            with open(MAPPING_PATH, "r") as f:
                mapping = json.load(f)
        return model, features, mapping
    except Exception as e:
        print(f"Error loading artifacts: {e}")
        return None, None, {}

model, model_features, label_mapping = load_artifacts()

class TaskInput(BaseModel):
    task_age: float = Field(..., description="Age of task in hours", ge=0)
    time_to_due: float = Field(..., description="Hours until due date")
    block_count: int = Field(..., description="Number of times blocked", ge=0)
    total_blocked_hours: float = Field(..., description="Total hours blocked", ge=0)
    column_change_count: int = Field(..., description="Number of column changes", ge=0)
    time_in_current_column: float = Field(..., description="Hours in current column", ge=0)
    dependency_count: int = Field(..., description="Total dependencies", ge=0)
    unresolved_dependencies: int = Field(..., description="Unresolved dependencies", ge=0)
    assignee_count: int = Field(..., description="Number of assignees", ge=0)
    estimateHours: float = Field(..., description="Estimated hours", ge=0)
    difficulty: int = Field(..., description="Difficulty score (1-5)", ge=1, le=5)
    progress_ratio: float = Field(..., description="Progress ratio (0-1)")
    is_overdue: int = Field(..., description="1 if overdue, else 0", ge=0, le=1)
    blocked_ratio: float = Field(..., description="Ratio of blocked time to age", ge=0)
    comment_count: int = Field(..., description="Number of comments", ge=0)
    desc_length: int = Field(..., description="Length of description in characters", ge=0)
    assignee_workload: int = Field(..., description="Total tasks assigned to the same assignees", ge=0)

@app.post("/predict")
async def predict(data: TaskInput):
    if model is None or model_features is None:
        raise HTTPException(status_code=503, detail="Model artifacts not found. Please train the model first.")

    # Convert input to dataframe
    input_dict = data.model_dump()
    
    # Backward compatibility for older artifacts that still include removed features.
    for feature in model_features:
        if feature not in input_dict:
            input_dict[feature] = 0
            
    df = pd.DataFrame([input_dict])
    
    # Ensure columns match training order
    df = df[model_features]
    
    try:
        # Predict probabilities for each class
        # XGBoost multi:softprob returns array of [P(LOW), P(MEDIUM), P(HIGH)]
        probs = model.predict_proba(df)[0]
        
        # Predicted class (index with max probability)
        pred_idx = int(np.argmax(probs))
        risk_level = label_mapping.get(str(pred_idx), "UNKNOWN")
        
        # Keep riskScore as an ordinal risk value so backend thresholds still
        # mean LOW ~= 0, MEDIUM ~= 0.5, HIGH ~= 1.
        risk_score = float((0.5 * probs[1]) + probs[2])
        
        # Assemble response
        return {
            "riskScore": round(risk_score, 4),
            "riskLevel": risk_level,
            "probabilities": {
                "LOW": round(float(probs[0]), 4),
                "MEDIUM": round(float(probs[1]), 4),
                "HIGH": round(float(probs[2]), 4)
            },
            "source": "xgboost_multiclass"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.get("/health")
async def health():
    return {
        "status": "ok", 
        "model_loaded": model is not None,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/model-info")
async def model_info():
    if model is None:
        raise HTTPException(status_code=404, detail="Model not loaded")
    
    return {
        "model_type": type(model).__name__,
        "features_count": len(model_features) if model_features else 0,
        "features": model_features,
        "label_mapping": label_mapping,
        "loaded_at": MODEL_LOAD_TIME
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
