import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.impute import SimpleImputer
import joblib
import os

SENTENCE_MODEL = "all-MiniLM-L6-v2"

CATEGORICAL_COLS = [
    'ambience_type', 'time_of_day', 'previous_day_mood',
    'face_emotion_hint', 'reflection_quality'
]
NUMERICAL_COLS = ['duration_min', 'sleep_hours', 'energy_level', 'stress_level']


class FeatureEngineer:
    def __init__(self):
        self.text_model = None
        self.label_encoders = {}
        self.numerical_imputer = SimpleImputer(strategy='median')
        self.categorical_imputer = SimpleImputer(strategy='most_frequent')
        self.scaler = StandardScaler()
        self.is_fitted = False

    def _load_text_model(self):
        if self.text_model is None:
            print("Loading sentence transformer (all-MiniLM-L6-v2)...")
            self.text_model = SentenceTransformer(SENTENCE_MODEL)

    def get_text_embeddings(self, texts):
        self._load_text_model()
        texts = [str(t) if pd.notna(t) else "no reflection" for t in texts]
        return self.text_model.encode(
            texts,
            show_progress_bar=True,
            batch_size=32,
            convert_to_numpy=True
        )

    def fit(self, df):
        # --- Categorical ---
        cat_data = df[CATEGORICAL_COLS].copy()
        cat_imputed = self.categorical_imputer.fit_transform(cat_data)
        cat_df = pd.DataFrame(cat_imputed, columns=CATEGORICAL_COLS)

        for col in CATEGORICAL_COLS:
            le = LabelEncoder()
            le.fit(cat_df[col].astype(str))
            self.label_encoders[col] = le

        # --- Numerical ---
        num_data = df[NUMERICAL_COLS].copy()
        num_imputed = self.numerical_imputer.fit_transform(num_data)
        self.scaler.fit(num_imputed)

        self.is_fitted = True
        return self

    def transform_metadata(self, df):
        # Categorical impute + encode
        cat_data = df[CATEGORICAL_COLS].copy()
        cat_imputed = self.categorical_imputer.transform(cat_data)
        cat_df = pd.DataFrame(cat_imputed, columns=CATEGORICAL_COLS)

        cat_encoded = np.zeros((len(df), len(CATEGORICAL_COLS)))
        for i, col in enumerate(CATEGORICAL_COLS):
            le = self.label_encoders[col]
            known = set(le.classes_)
            vals = cat_df[col].astype(str).apply(
                lambda x: x if x in known else le.classes_[0]
            )
            cat_encoded[:, i] = le.transform(vals)

        # Numerical impute + scale
        num_data = df[NUMERICAL_COLS].copy()
        num_imputed = self.numerical_imputer.transform(num_data)
        num_scaled = self.scaler.transform(num_imputed)

        return np.hstack([cat_encoded, num_scaled])

    def transform(self, df, use_text=True):
        metadata = self.transform_metadata(df)
        if use_text:
            text_emb = self.get_text_embeddings(df['journal_text'].tolist())
            return np.hstack([text_emb, metadata])
        return metadata

    def fit_transform(self, df, use_text=True):
        self.fit(df)
        return self.transform(df, use_text)

    def save(self, path):
        state = {
            'label_encoders': self.label_encoders,
            'numerical_imputer': self.numerical_imputer,
            'categorical_imputer': self.categorical_imputer,
            'scaler': self.scaler,
            'is_fitted': self.is_fitted
        }
        joblib.dump(state, path)
        print(f"FeatureEngineer saved → {path}")

    def load(self, path):
        state = joblib.load(path)
        self.label_encoders = state['label_encoders']
        self.numerical_imputer = state['numerical_imputer']
        self.categorical_imputer = state['categorical_imputer']
        self.scaler = state['scaler']
        self.is_fitted = state['is_fitted']
        print(f"FeatureEngineer loaded ← {path}")
        return self