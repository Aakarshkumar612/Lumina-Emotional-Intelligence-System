import os
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    classification_report, accuracy_score,
    mean_absolute_error, mean_squared_error
)
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from xgboost import XGBClassifier, XGBRegressor
from imblearn.over_sampling import SMOTE
import warnings
warnings.filterwarnings('ignore')

from app.utils.features import FeatureEngineer

# ── Paths ────────────────────────────────────────────────────────
TRAIN_PATH     = "data/train.csv"
ARTIFACTS_DIR  = "artifacts"

STATE_MODEL_PATH      = os.path.join(ARTIFACTS_DIR, "state_classifier.pkl")
INTENSITY_MODEL_PATH  = os.path.join(ARTIFACTS_DIR, "intensity_regressor.pkl")
STATE_ENCODER_PATH    = os.path.join(ARTIFACTS_DIR, "state_label_encoder.pkl")
FEATURE_ENG_PATH      = os.path.join(ARTIFACTS_DIR, "feature_engineer.pkl")
META_PATH             = os.path.join(ARTIFACTS_DIR, "training_meta.pkl")


def load_data():
    print("Loading training data...")
    df = pd.read_csv(TRAIN_PATH)
    print(f"  Shape: {df.shape}")
    print(f"  Emotional states: {df['emotional_state'].value_counts().to_dict()}")
    print(f"  Intensity distribution:\n{df['intensity'].value_counts().sort_index()}")
    return df


def train_state_classifier(X_train, y_train, X_val, y_val, state_encoder):
    print("\n=== Training Emotional State Classifier ===")

    # Handle class imbalance with SMOTE
    print("  Applying SMOTE for class balance...")
    try:
        sm = SMOTE(random_state=42, k_neighbors=3)
        X_res, y_res = sm.fit_resample(X_train, y_train)
        print(f"  After SMOTE: {X_res.shape}")
    except Exception as e:
        print(f"  SMOTE failed ({e}), using original data")
        X_res, y_res = X_train, y_train

    # XGBoost classifier
    model = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        use_label_encoder=False,
        eval_metric='mlogloss',
        random_state=42,
        n_jobs=-1
    )

    model.fit(
        X_res, y_res,
        eval_set=[(X_val, y_val)],
        verbose=False
    )

    # Evaluate
    y_pred = model.predict(X_val)
    acc = accuracy_score(y_val, y_pred)
    print(f"\n  Validation Accuracy: {acc:.4f}")
    print("\n  Classification Report:")
    print(classification_report(
        y_val, y_pred,
        target_names=state_encoder.classes_
    ))

    return model


def train_intensity_model(X_train, y_train, X_val, y_val):
    print("\n=== Training Intensity Classifier ===")
    print("  Treating intensity as classification (1-5 discrete labels)")

    # Convert to int labels (1-5)
    y_train_cls = y_train.astype(int) - 1  # shift to 0-4 for XGBoost
    y_val_cls   = y_val.astype(int) - 1

    # Handle class imbalance
    try:
        sm = SMOTE(random_state=42, k_neighbors=3)
        X_res, y_res = sm.fit_resample(X_train, y_train_cls)
        print(f"  After SMOTE: {X_res.shape}")
    except Exception as e:
        print(f"  SMOTE skipped ({e})")
        X_res, y_res = X_train, y_train_cls

    model = XGBClassifier(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        use_label_encoder=False,
        eval_metric='mlogloss',
        random_state=42,
        n_jobs=-1,
        num_class=5,
        objective='multi:softprob'
    )

    model.fit(
        X_res, y_res,
        eval_set=[(X_val, y_val_cls)],
        verbose=False
    )

    y_pred = model.predict(X_val) + 1  # shift back to 1-5
    y_val_orig = y_val_cls + 1

    acc = accuracy_score(y_val_orig, y_pred)
    mae = mean_absolute_error(y_val_orig, y_pred)
    print(f"  Accuracy: {acc:.4f}")
    print(f"  MAE:      {mae:.4f}")
    print(classification_report(y_val_orig, y_pred))

    return model

def run_ablation_study(df, feature_eng, state_encoder):
    print("\n=== Ablation Study: Text-Only vs Text+Metadata ===")

    y_state = state_encoder.transform(df['emotional_state'])

    # Text only
    print("\n  [1] Text-Only Features...")
    X_text = feature_eng.transform(df, use_text=True)
    # Zero out metadata columns (keep only text embeddings = first 384)
    X_text_only = X_text[:, :384]

    scores_text = cross_val_score(
        XGBClassifier(n_estimators=100, random_state=42, n_jobs=-1, eval_metric='mlogloss'),
        X_text_only, y_state, cv=3, scoring='accuracy'
    )
    print(f"  Text-Only CV Accuracy: {scores_text.mean():.4f} ± {scores_text.std():.4f}")

    # Text + Metadata
    print("\n  [2] Text + Metadata Features...")
    scores_full = cross_val_score(
        XGBClassifier(n_estimators=100, random_state=42, n_jobs=-1, eval_metric='mlogloss'),
        X_text, y_state, cv=3, scoring='accuracy'
    )
    print(f"  Text+Metadata CV Accuracy: {scores_full.mean():.4f} ± {scores_full.std():.4f}")

    return {
        "text_only_accuracy": float(scores_text.mean()),
        "text_metadata_accuracy": float(scores_full.mean()),
        "improvement": float(scores_full.mean() - scores_text.mean())
    }


def main():
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)

    # 1. Load data
    df = load_data()

    # 2. Encode target
    print("\n=== Encoding Targets ===")
    state_encoder = LabelEncoder()
    y_state = state_encoder.fit_transform(df['emotional_state'])
    y_intensity = df['intensity'].values.astype(float)
    print(f"  Emotional state classes: {list(state_encoder.classes_)}")

    # 3. Feature engineering
    print("\n=== Feature Engineering ===")
    feature_eng = FeatureEngineer()
    X = feature_eng.fit_transform(df, use_text=True)
    print(f"  Final feature shape: {X.shape}")

    # 4. Train/Val split
    X_train, X_val, ys_train, ys_val, yi_train, yi_val = train_test_split(
        X, y_state, y_intensity,
        test_size=0.15,
        random_state=42,
        stratify=y_state
    )
    print(f"\n  Train: {X_train.shape}, Val: {X_val.shape}")

    # 5. Train models
    state_model     = train_state_classifier(X_train, ys_train, X_val, ys_val, state_encoder)
    intensity_model = train_intensity_model(X_train, yi_train, X_val, yi_val)

    # 6. Ablation study
    try:
        ablation_results = run_ablation_study(df, feature_eng, state_encoder)
    except Exception as e:
        print(f"  Ablation skipped: {e}")
        ablation_results = {"text_only_accuracy": 0.0, "text_metadata_accuracy": 0.0, "improvement": 0.0}

    # 7. Save everything
    print("\n=== Saving Artifacts ===")
    joblib.dump(state_model,     STATE_MODEL_PATH)
    joblib.dump(intensity_model, INTENSITY_MODEL_PATH)
    joblib.dump(state_encoder,   STATE_ENCODER_PATH)
    feature_eng.save(FEATURE_ENG_PATH)

    meta = {
        "state_classes":   list(state_encoder.classes_),
        "feature_shape":   X.shape[1],
        "train_samples":   len(X_train),
        "val_samples":     len(X_val),
        "ablation":        ablation_results,
        "intensity_as":    "hybrid",
    }
    joblib.dump(meta, META_PATH)
    print(f"  Saved: {STATE_MODEL_PATH}")
    print(f"  Saved: {INTENSITY_MODEL_PATH}")
    print(f"  Saved: {STATE_ENCODER_PATH}")
    print(f"  Saved: {FEATURE_ENG_PATH}")
    print(f"  Saved: {META_PATH}")
    print("\n✅ Training complete!")
    return state_model, intensity_model, feature_eng, state_encoder

if __name__ == "__main__":
    main()