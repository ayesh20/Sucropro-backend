from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd

app = FastAPI(title="SucroPro ML Prediction Service")

# Load model and scaler globally
model = None
scaler = None
try:
    model = joblib.load("model.pkl")
    scaler = joblib.load("scaler.pkl")
    print("ML Model and Scaler loaded successfully.")
except Exception as e:
    print("Warning: Could not load model.pkl or scaler.pkl. Please run 'python train_model.py' first.")

class PredictionRequest(BaseModel):
    duration_days: int
    avg_temp: float
    avg_humidity: float
    brix: float
    pol: float
    purity: float
    cane_age: float
    batch_weight: float

class PredictionResponse(BaseModel):
    predicted_rendement: float
    feature_importance: dict

@app.get("/health")
def health_check():
    status = "ok" if model and scaler else "model_missing"
    return {"status": status}

@app.post("/predict", response_model=PredictionResponse)
def predict(data: PredictionRequest):
    if not model or not scaler:
        raise HTTPException(status_code=503, detail="Model not loaded. Train the model first.")
        
    # Prepare input features matching training data
    features = {
        "durationDays": [data.duration_days],
        "avgTemp": [data.avg_temp],
        "avgHumidity": [data.avg_humidity],
        "brix": [data.brix],
        "pol": [data.pol],
        "purity": [data.purity]
    }
    
    df = pd.DataFrame(features)
    
    # Scale and Predict
    scaled_features = scaler.transform(df)
    prediction = model.predict(scaled_features)[0]
    
    # Feature Importance
    feature_names = ['durationDays', 'avgTemp', 'avgHumidity', 'brix', 'pol', 'purity']
    importances = model.feature_importances_
    
    # Convert num importances to float
    feature_importance = {name: float(importance) for name, importance in zip(feature_names, importances)}
    
    return {
        "predicted_rendement": round(float(prediction), 2),
        "feature_importance": feature_importance
    }
