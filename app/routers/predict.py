from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from app.pipeline.predict_engine import get_engine

router = APIRouter()


class PredictRequest(BaseModel):
    id:                  Optional[int]   = None
    journal_text:        str             = Field(..., min_length=1)
    ambience_type:       Optional[str]   = "forest"
    duration_min:        Optional[float] = 20
    sleep_hours:         Optional[float] = None
    energy_level:        Optional[float] = 5
    stress_level:        Optional[float] = 5
    time_of_day:         Optional[str]   = "morning"
    previous_day_mood:   Optional[str]   = None
    face_emotion_hint:   Optional[str]   = None
    reflection_quality:  Optional[str]   = "clear"


class PredictResponse(BaseModel):
    predicted_state:      str
    predicted_intensity:  int
    confidence:           float
    uncertain_flag:       int
    what_to_do:           str
    when_to_do:           str
    supportive_message:   str
    state_confidence:     float
    intensity_confidence: float


class BatchPredictRequest(BaseModel):
    records: List[PredictRequest]


@router.post("/predict", response_model=PredictResponse)
def predict_single(request: PredictRequest):
    try:
        engine = get_engine()
        result = engine.predict_single(request.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict/batch")
def predict_batch(request: BatchPredictRequest):
    try:
        engine  = get_engine()
        records = [r.model_dump() for r in request.records]
        results = engine.predict_batch(records)
        return {"predictions": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))