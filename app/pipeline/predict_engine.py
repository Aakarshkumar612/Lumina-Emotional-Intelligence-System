import numpy as np
import pandas as pd
import joblib
import os
from app.utils.features import FeatureEngineer
from app.utils.uncertainty import get_confidence, get_uncertain_flag, get_intensity_confidence
from app.pipeline.decision_engine import DecisionEngine

ARTIFACTS_DIR        = "artifacts"
STATE_MODEL_PATH     = os.path.join(ARTIFACTS_DIR, "state_classifier.pkl")
INTENSITY_MODEL_PATH = os.path.join(ARTIFACTS_DIR, "intensity_regressor.pkl")
STATE_ENCODER_PATH   = os.path.join(ARTIFACTS_DIR, "state_label_encoder.pkl")
FEATURE_ENG_PATH     = os.path.join(ARTIFACTS_DIR, "feature_engineer.pkl")


class PredictionEngine:
    def __init__(self):
        self.state_model     = None
        self.intensity_model = None
        self.state_encoder   = None
        self.feature_eng     = None
        self.decision_engine = DecisionEngine()
        self.is_loaded       = False

    def load(self):
        print("Loading models...")
        self.state_model     = joblib.load(STATE_MODEL_PATH)
        self.intensity_model = joblib.load(INTENSITY_MODEL_PATH)
        self.state_encoder   = joblib.load(STATE_ENCODER_PATH)
        self.feature_eng     = FeatureEngineer().load(FEATURE_ENG_PATH)
        self.is_loaded       = True
        print("✅ All models loaded.")
        return self

    def _build_df(self, input_data: dict) -> pd.DataFrame:
        """Convert input dict to a single-row DataFrame."""
        defaults = {
            "journal_text":      "",
            "ambience_type":     "forest",
            "duration_min":      20,
            "sleep_hours":       7.0,
            "energy_level":      5,
            "stress_level":      5,
            "time_of_day":       "morning",
            "previous_day_mood": "neutral",
            "face_emotion_hint": "neutral_face",
            "reflection_quality":"clear",
        }
        row = {**defaults, **input_data}
        return pd.DataFrame([row])

    def predict_single(self, input_data: dict) -> dict:
        """Run full prediction pipeline on a single input."""
        if not self.is_loaded:
            self.load()

        df = self._build_df(input_data)

        # ── Feature extraction ──────────────────────────────────
        X = self.feature_eng.transform(df, use_text=True)

        # ── Emotional state prediction ──────────────────────────
        state_proba  = self.state_model.predict_proba(X)[0]
        state_idx    = np.argmax(state_proba)
        predicted_state = self.state_encoder.classes_[state_idx]
        state_confidence = get_confidence(state_proba)
        state_uncertain  = get_uncertain_flag(state_confidence)

        # ── Intensity prediction ────────────────────────────────
        intensity_proba = self.intensity_model.predict_proba(X)[0]
        intensity_idx   = np.argmax(intensity_proba)
        ml_intensity    = intensity_idx + 1  # shift back to 1-5
        intensity_conf  = get_confidence(intensity_proba)

        # Hybrid intensity — use rule-based if ML is uncertain
        final_intensity = self.decision_engine.estimate_intensity(
            ml_prediction   = ml_intensity,
            ml_confidence   = intensity_conf,
            stress_level    = float(df['stress_level'].iloc[0]),
            energy_level    = float(df['energy_level'].iloc[0]),
            predicted_state = predicted_state
        )
        intensity_uncertain = get_uncertain_flag(intensity_conf, threshold=0.45)

        # ── Decision engine ─────────────────────────────────────
        what, when = self.decision_engine.decide(
            predicted_state = predicted_state,
            intensity       = final_intensity,
            stress_level    = float(df['stress_level'].iloc[0]),
            energy_level    = float(df['energy_level'].iloc[0]),
            time_of_day     = str(df['time_of_day'].iloc[0]),
        )

        # ── Supportive message ───────────────────────────────────
        message = self.decision_engine.generate_message(
            predicted_state = predicted_state,
            intensity       = final_intensity,
            what            = what,
            when            = when
        )

        # ── Overall confidence ───────────────────────────────────
        overall_confidence = round((state_confidence + intensity_conf) / 2, 4)
        overall_uncertain  = 1 if (state_uncertain or intensity_uncertain) else 0

        return {
            "predicted_state":     predicted_state,
            "predicted_intensity": final_intensity,
            "confidence":          round(overall_confidence, 4),
            "uncertain_flag":      overall_uncertain,
            "what_to_do":          what,
            "when_to_do":          when,
            "supportive_message":  message,
            "state_confidence":    round(float(state_confidence), 4),
            "intensity_confidence":round(float(intensity_conf), 4),
        }

    def predict_batch(self, records: list[dict]) -> list[dict]:
        """Run prediction on a list of input dicts."""
        if not self.is_loaded:
            self.load()

        results = []
        for record in records:
            try:
                result = self.predict_single(record)
                result["id"] = record.get("id", None)
                results.append(result)
            except Exception as e:
                results.append({
                    "id":              record.get("id", None),
                    "error":           str(e),
                    "predicted_state": "unknown",
                    "predicted_intensity": 3,
                    "confidence":      0.0,
                    "uncertain_flag":  1,
                    "what_to_do":      "light_planning",
                    "when_to_do":      "later_today",
                    "supportive_message": "We couldn't fully read your state. Take a gentle pause.",
                })
        return results


# Singleton — loaded once, reused across all requests
_engine_instance = None

def get_engine() -> PredictionEngine:
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = PredictionEngine().load()
    return _engine_instance