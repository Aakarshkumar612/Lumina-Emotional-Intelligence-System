from fastapi import APIRouter
import joblib
import os

router = APIRouter()

@router.get("/health")
def health_check():
    artifacts = [
        "artifacts/state_classifier.pkl",
        "artifacts/intensity_regressor.pkl",
        "artifacts/state_label_encoder.pkl",
        "artifacts/feature_engineer.pkl",
    ]
    missing = [a for a in artifacts if not os.path.exists(a)]
    status  = "healthy" if not missing else "degraded"

    meta = {}
    if os.path.exists("artifacts/training_meta.pkl"):
        meta = joblib.load("artifacts/training_meta.pkl")

    return {
        "status":         status,
        "missing_files":  missing,
        "model_classes":  meta.get("state_classes", []),
        "train_samples":  meta.get("train_samples", 0),
        "ablation":       meta.get("ablation", {}),
    }