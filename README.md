# Lumina — Emotional Intelligence System 🌿

> AI system that understands human emotional state, reasons under uncertainty,
> and guides users toward a better mental state.
> Built for ArvyaX Machine Learning Internship Assignment · RevoltronX

---

## 🌐 Live Demo

| Service | URL |
|---|---|
| Backend API | `https://lumina-emotion-engine.onrender.com` |
| API Docs (Swagger) | `https://lumina-emotion-engine.onrender.com/docs` |
| Frontend | Deployed via Lovable.dev |

---

## 🧠 Philosophy

> *AI should not just understand humans. It should help them move toward a better state.*

Lumina is built around three pillars:

- **Understand** — Predict emotional state from noisy journal text + contextual signals
- **Decide** — Recommend what action to take and when, using a rule-based decision engine
- **Guide** — Generate supportive, human-like messages to help users move forward

---

## 🗺️ Architecture

```
Journal Text ──► Sentence-BERT (all-MiniLM-L6-v2, local) ──► 384-dim embeddings ─┐
                                                                                    ├──► XGBoost ──► emotional_state
Sleep / Stress / Energy / Time / Mood ──► Scaled metadata (9-dim) ─────────────────┘         │
                                                                                               ▼
                                                                           Hybrid Decision Engine
                                                                           (what_to_do + when_to_do)
                                                                                               │
                                                                                               ▼
                                                                           Confidence Score + Uncertain Flag
                                                                                               │
                                                                                               ▼
                                                                           Supportive Message Generator
```

---

## 📁 Project Structure

```
Lumina-Emotional-Intelligence-System/
├── app/
│   ├── main.py                        ← FastAPI app entry point
│   ├── routers/
│   │   ├── predict.py                 ← /predict and /predict/batch endpoints
│   │   └── health.py                  ← /health endpoint
│   ├── pipeline/
│   │   ├── train.py                   ← End-to-end training pipeline
│   │   ├── predict_engine.py          ← Inference engine (singleton)
│   │   └── decision_engine.py         ← What + When decision logic
│   └── utils/
│       ├── features.py                ← Feature engineering + embeddings
│       └── uncertainty.py             ← Confidence + uncertain flag logic
├── artifacts/                         ← Saved trained models
│   ├── state_classifier.pkl
│   ├── intensity_regressor.pkl
│   ├── state_label_encoder.pkl
│   ├── feature_engineer.pkl
│   └── training_meta.pkl
├── data/
│   ├── train.csv                      ← 1200 training samples
│   └── test.csv                       ← 120 test samples
├── frontend/                          ← React + Tailwind UI (via Lovable.dev)
│   ├── src/
│   │   ├── api/emotionApi.ts          ← API integration layer
│   │   ├── components/lumina/         ← Core UI components
│   │   │   ├── NewSession.tsx         ← Journal input + form
│   │   │   ├── ResultCard.tsx         ← Prediction result display
│   │   │   ├── History.tsx            ← Session history + charts
│   │   │   ├── Sidebar.tsx            ← Navigation sidebar
│   │   │   └── About.tsx              ← About page
│   │   └── pages/Index.tsx            ← Main page router
│   ├── package.json
│   └── vite.config.ts
├── notebooks/                         ← EDA notebooks
├── generate_predictions.py            ← Generates predictions.csv
├── predictions.csv                    ← Final output (120 predictions)
├── render.yaml                        ← Render deployment config
├── requirements-render.txt            ← Production dependencies
├── requirements.txt                   ← Local development dependencies
├── README.md
├── ERROR_ANALYSIS.md
└── EDGE_PLAN.md
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Anaconda or Miniconda installed
- Python 3.12
- Node.js 18+ (for frontend)
- Git

### 1. Clone the repository
```bash
git clone https://github.com/Aakarshkumar612/Lumina-Emotional-Intelligence-System.git
cd Lumina-Emotional-Intelligence-System
```

### 2. Create and activate conda environment
```bash
conda create -n arvyax python=3.12 -y
conda activate arvyax
```

### 3. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 4. Add data files
Place `train.csv` and `test.csv` inside the `data/` folder.

### 5. Train the models
```bash
python -m app.pipeline.train
```

This will:
- Download `all-MiniLM-L6-v2` (~90MB, first run only, cached after)
- Generate Sentence-BERT embeddings for all journal texts
- Train emotional state XGBoost classifier (with SMOTE balancing)
- Train intensity XGBoost classifier (with hybrid rule-based fallback)
- Run ablation study (text-only vs text+metadata)
- Save all artifacts to `artifacts/`

Expected output:
```
✅ Training complete!
Validation Accuracy: 0.5667
```

### 6. Generate predictions
```bash
python generate_predictions.py
```
Output: `predictions.csv` (120 rows)

### 7. Run the FastAPI backend
```bash
uvicorn app.main:app --reload --port 8000
```
- API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

### 8. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend: http://localhost:5173

---

## 🔌 API Endpoints

### GET `/`
System status.

### GET `/health`
Returns model status, loaded classes, training metadata, ablation results.

### POST `/predict`
Single prediction endpoint.

**Request Body:**
```json
{
  "journal_text": "I feel scattered and cant focus at all today",
  "ambience_type": "forest",
  "duration_min": 20,
  "sleep_hours": 5.5,
  "energy_level": 3,
  "stress_level": 8,
  "time_of_day": "morning",
  "previous_day_mood": "restless",
  "face_emotion_hint": "tired_face",
  "reflection_quality": "clear"
}
```

**Response:**
```json
{
  "predicted_state": "restless",
  "predicted_intensity": 5,
  "confidence": 0.3453,
  "uncertain_flag": 1,
  "what_to_do": "box_breathing",
  "when_to_do": "now",
  "supportive_message": "You seem very restless right now. Let's slow things down — try a short breathing exercise now to reset your system.",
  "state_confidence": 0.342,
  "intensity_confidence": 0.3487
}
```

### POST `/predict/batch`
Batch predictions for multiple records.

**Request Body:**
```json
{
  "records": [
    { "journal_text": "...", "stress_level": 7, ... },
    { "journal_text": "...", "stress_level": 3, ... }
  ]
}
```

---

## 🧪 Model Details

### Dataset
- **Train:** 1200 samples
- **Test:** 120 samples
- **Features:** journal_text, ambience_type, duration_min, sleep_hours, energy_level, stress_level, time_of_day, previous_day_mood, face_emotion_hint, reflection_quality
- **Targets:** emotional_state (6 classes), intensity (1-5)
- **Missing data:** face_emotion_hint (10.25%), previous_day_mood (1.25%), sleep_hours (0.58%)

### Part 1 — Emotional State Prediction
| Property | Value |
|---|---|
| Model | XGBoost Classifier |
| Text Encoder | Sentence-BERT (all-MiniLM-L6-v2) |
| Feature Dimensions | 393 (384 text + 9 metadata) |
| Classes | calm, focused, mixed, neutral, overwhelmed, restless |
| Validation Accuracy | 56.7% |
| Random Baseline | 16.7% (6 classes) |
| Class Balancing | SMOTE oversampling |

### Part 2 — Intensity Prediction
| Property | Value |
|---|---|
| Approach | Hybrid (ML + rule-based fallback) |
| Model | XGBoost Classifier (labels 1-5) |
| Fallback | Rule-based using stress + energy signals |
| Fallback Trigger | When ML confidence < 0.45 |
| Why Hybrid | Intensity labels are noisy — near-random ML accuracy (~23%) is expected for subjective labels. Rule-based fallback provides more reliable estimates for extreme cases. |

**Intensity is treated as classification** (discrete 1–5 labels) evaluated with both accuracy and MAE metrics.

### Part 3 — Decision Engine

Rule-based engine combining predicted state + intensity + stress + energy + time_of_day:

**What to do:**

| State | High Stress (≥7) | Low Energy (≤3) | High Energy (≥7) | Default |
|---|---|---|---|---|
| calm | — | light_planning | deep_work | journaling |
| focused | — | light_planning | deep_work | deep_work |
| mixed | box_breathing | journaling | — | journaling |
| neutral | — | rest | deep_work | light_planning |
| overwhelmed | box_breathing | grounding | — | grounding |
| restless | box_breathing | movement | — | movement |

**When to do it:**

| Time of Day | Intensity 5 | Intensity 4 | Intensity 3 | Intensity 2 | Intensity 1 |
|---|---|---|---|---|---|
| morning | now | now | within_15_min | within_15_min | later_today |
| afternoon | now | within_15_min | within_15_min | later_today | later_today |
| evening | now | within_15_min | tonight | tonight | tonight |
| night | now | tonight | tonight | tomorrow_morning | tomorrow_morning |

Urgent states (overwhelmed, restless, mixed) with intensity ≥ 4 → always "now"

### Part 4 — Uncertainty Modeling
- **State confidence:** max class probability from XGBoost softmax output
- **Intensity confidence:** max class probability from intensity classifier
- **Overall confidence:** average of both scores
- **Uncertain flag:** 1 if overall confidence < 0.50, else 0
- **Result:** 77.5% of test predictions flagged as uncertain — this is expected and honest for a noisy 6-class problem

### Part 5 — Feature Importance
- **Text embeddings** (Sentence-BERT, 384 dims) contribute the dominant signal for emotional state detection — they capture semantic nuance in journal text
- **stress_level** and **energy_level** are the most important metadata features — directly drive both intensity estimation and decision engine
- **sleep_hours** is highly informative for overwhelmed/tired states
- **face_emotion_hint** provides valuable signal but has 10% missing data
- **time_of_day** is critical for the "when" decision — not for state prediction
- **ambience_type** has weaker signal than expected — users adapt differently to the same ambience

### Part 6 — Ablation Study

| Model | CV Accuracy | Std Dev |
|---|---|---|
| Text Only (BERT embeddings) | 44.92% | ±15.67% |
| Text + Metadata | 42.75% | ±15.40% |

**Key Insight:** Text-only marginally outperforms text+metadata in cross-validation. This suggests metadata adds some noise to the classification task. However, metadata is essential for the decision engine (what/when recommendations) and intensity estimation — it cannot be removed from the full system.

---

## 🤖 Frontend — Lumina UI

Built with React + TypeScript + Tailwind CSS via Lovable.dev.

### Pages
1. **New Session** — Journal input form + live prediction result card
2. **History** — Past sessions with emotion distribution donut chart + intensity bar chart
3. **About** — System explanation + tech stack

### Key Features
- Dark premium UI with violet/cyan accent colors
- Glassmorphism cards with glow effects
- Animated result card (fade + slide)
- Confidence meter with color-coded progress bar
- Emotion state badges with unique colors per state
- Session history persisted in localStorage
- Fully responsive (mobile bottom nav, tablet collapsed sidebar, desktop full sidebar)
- Error handling with retry on API failure

### Connect Frontend to Backend
Create `frontend/.env`:
```
VITE_API_URL=https://your-render-url.onrender.com
```

For local development:
```
VITE_API_URL=http://localhost:8000
```

---

## 🚀 Deployment

### Backend — Render

1. Push code to GitHub
2. Go to render.com → New Web Service
3. Connect `Aakarshkumar612/Lumina-Emotional-Intelligence-System`
4. Settings:
   - **Build Command:** `pip install -r requirements-render.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Python Version:** 3.11

### Frontend — Lovable / Vercel

Option A — Lovable built-in deploy (one click)
Option B — `cd frontend && npm run build` → deploy `dist/` to Vercel/Netlify

---

## 🔧 Robustness

### Very short text ("ok", "fine")
Sentence-BERT still produces a valid 384-dim embedding. The model falls back to metadata-driven prediction and sets `uncertain_flag = 1`. When text length < 5 words, confidence is automatically lower.

### Missing values
All missing values are handled at the feature engineering layer:
- Numerical columns → median imputation
- Categorical columns → most-frequent imputation
- No hard failures — system always returns a prediction

### Contradictory inputs
When signals conflict (e.g., "I feel great" text + stress=9 + sleep=3):
- State prediction relies on text embeddings (may predict calm)
- Intensity hybrid engine overrides based on stress/energy signals
- Decision engine uses rule-based logic on stress/energy → recommends appropriate action regardless of text sentiment

---

## 📊 predictions.csv Format

```
id, predicted_state, predicted_intensity, confidence, uncertain_flag, what_to_do, when_to_do, supportive_message
10001, focused, 3, 0.6503, 0, light_planning, tonight, "You're feeling moderately focused..."
10002, focused, 1, 0.3574, 1, light_planning, later_today, "You're feeling mildly focused..."
...
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Language | Python 3.12 |
| API Framework | FastAPI |
| ML Models | XGBoost |
| Text Embeddings | Sentence-BERT (all-MiniLM-L6-v2) |
| Feature Engineering | Scikit-learn + SMOTE |
| Serialization | Joblib |
| Frontend | React + TypeScript + Tailwind CSS |
| Charts | Recharts |
| Frontend Builder | Lovable.dev |
| Deployment | Render (backend) |
| Version Control | Git + GitHub |

---

## 📝 Additional Documentation

- [ERROR_ANALYSIS.md](./ERROR_ANALYSIS.md) — 10 failure case analyses with root causes and fixes
- [EDGE_PLAN.md](./EDGE_PLAN.md) — Mobile/on-device deployment strategy

---

## 👤 Author

**Aakarsh Kumar**
Artificial Intelligence Engineer