import numpy as np


def get_confidence(proba: np.ndarray) -> float:
    """
    Confidence = max class probability.
    High confidence → model is sure.
    Low confidence → model is unsure.
    """
    return float(np.max(proba))


def get_uncertain_flag(confidence: float, threshold: float = 0.50) -> int:
    """
    Flag = 1 if confidence is below threshold (model is uncertain).
    Flag = 0 if model is confident.
    """
    return 1 if confidence < threshold else 0


def get_intensity_confidence(
    predicted: float,
    all_predictions: np.ndarray = None
) -> float:
    """
    For regression (intensity), confidence is based on how close
    the prediction is to a clean integer value (1-5).
    Closer to a whole number = more confident.
    """
    distance_to_nearest_int = abs(predicted - round(predicted))
    # distance 0 → confidence 1.0, distance 0.5 → confidence 0.0
    confidence = 1.0 - (distance_to_nearest_int * 2)
    return float(np.clip(confidence, 0.1, 1.0))