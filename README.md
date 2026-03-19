# ✦ Lumina — Emotional Intelligence System

<div align="center">

![Lumina Banner](https://img.shields.io/badge/Lumina-Emotional%20Intelligence%20System-7C3AED?style=for-the-badge&logoColor=white)

**AI system that understands human emotional state, reasons under uncertainty,**
**and guides users toward a better mental state.**

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-Visit%20Lumina-06B6D4?style=for-the-badge)](https://lumina-frontend-rhzf.onrender.com)
[![API Docs](https://img.shields.io/badge/📡%20API%20Docs-Swagger%20UI-10B981?style=for-the-badge)](https://lumina-emotional-intelligence-system.onrender.com/docs)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/Aakarshkumar612/Lumina-Emotional-Intelligence-System)

*Built for ArvyaX Machine Learning Internship Assignment · RevoltronX*

</div>

---

## 🌐 Live Links

| Service | URL |
|---|---|
| 🎨 **Frontend UI** | https://lumina-frontend-rhzf.onrender.com |
| 📡 **Backend API** | https://lumina-emotional-intelligence-system.onrender.com |
| 📖 **API Swagger Docs** | https://lumina-emotional-intelligence-system.onrender.com/docs |

> ⚠️ **Note:** Hosted on Render free tier. First load may take ~50 seconds to wake up. Subsequent requests are fast.

---

## 🧠 Philosophy

> *AI should not just understand humans. It should help them move toward a better state.*
> — Team ArvyaX

Lumina is built around three pillars:

| Pillar | What It Does |
|---|---|
| 🔍 **Understand** | Predicts emotional state from noisy journal text + contextual signals |
| ⚡ **Decide** | Recommends what action to take and exactly when to take it |
| 💚 **Guide** | Generates supportive human-like messages to move users forward |

---

## 🗺️ System Architecture

```
Journal Text ──► Sentence-BERT (all-MiniLM-L6-v2) ──► 384-dim embeddings ─┐
                       [runs locally, no API needed]                        │
                                                                             ├──► XGBoost ──► emotional_state
Sleep / Stress / Energy / Time / Mood ──► Scaled metadata (9-dim) ─────────┘         │
                                                                                       ▼
                                                                         Hybrid Decision Engine
                                                                         (what_to_do + when_to_do)
                                                                                       │
                                                                                       ▼
                                                                         Confidence Score
                                                                         + Uncertain Flag
                                                                                       │
                                                                                       ▼
                                                                         Supportive Message
```

---

## 📁 Project Structure

```
Lumina-Emotional-Intelligence-System/
│
├── 📂 app/                          ← FastAPI Backend
│   ├── main.py                      ← App entry point + CORS
│   ├── routers/
│   │   ├── predict.py               ← POST /predict, POST /predict/batch
│   │   └── health.py                ← GET /health
│   ├── pipeline/
│   │   ├── train.py                 ← End-to-end training pipeline
│   │   ├── predict_engine.py        ← Inference singleton
│   │   └── decision_engine.py       ← What + When rule engine
│   └── utils/
│       ├── features.py              ← Sentence-BERT + feature engineering
│       └── uncertainty.py           ← Confidence + uncertain flag
│
├── 📂 frontend/                     ← React + Tailwind UI
│   ├── src/
│   │   ├── api/emotionApi.ts        ← API integration layer
│   │   ├── components/lumina/       ← Core UI components
│   │   │   ├── NewSession.tsx       ← Journal form + result card
│   │   │   ├── History.tsx          ← Session history + charts
│   │   │   ├── Sidebar.tsx          ← Navigation
│   │   │   └── About.tsx            ← About page
│   │   └── pages/Index.tsx          ← Main router
│   └── package.json
│
├── 📂 artifacts/                    ← Trained models (auto-generated)
│   ├── state_classifier.pkl
│   ├── intensity_regressor.pkl
│   ├── state_label_encoder.pkl
│   └── feature_engineer.pkl
│
├── 📂 data/
│   ├── train.csv                    ← 1200 training samples
│   └── test.csv                     ← 120 test samples
│
├── 📂 notebooks/
│   └── eda_analysis.ipynb           ← Full EDA with visualizations
│
├── 📄 predictions.csv               ← Final predictions (120 rows)
├── 📄 README.md
├── 📄 ERROR_ANALYSIS.md             ← 10 failure case analyses
├── 📄 EDGE_PLAN.md                  ← Mobile/on-device deployment plan
├── 📄 render.yaml                   ← Render deployment config
├── 📄 requirements.txt              ← Local dependencies
└── 📄 requirements-render.txt       ← Production dependencies
```

---

## ⚙️ Local Setup

### Prerequisites
- Anaconda / Miniconda
- Python 3.12
- Node.js 18+
- Git

### 1. Clone the repo
```bash
git clone https://github.com/Aakarshkumar612/Lumina-Emotional-Intelligence-System.git
cd Lumina-Emotional-Intelligence-System
```

### 2. Create conda environment
```bash
conda create -n arvyax python=3.12 -y
conda activate arvyax
```

### 3. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 4. Train the models
```bash
python -m app.pipeline.train
```

- Downloads `all-MiniLM-L6-v2` (~90MB, first run only, cached after)
- Trains emotional state + intensity classifiers
- Runs ablation study
- Saves all artifacts to `artifacts/`

### 5. Generate predictions
```bash
python generate_predictions.py
```

### 6. Run the API
```bash
uvicorn app.main:app --reload --port 8000
```

→ API: http://localhost:8000
→ Docs: http://localhost:8000/docs

### 7. Run the Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

→ UI: http://localhost:8080

---

## 📡 API Reference

### `POST /predict`

**Request:**
```json
{
  "journal_text": "I feel scattered and overwhelmed today",
  "ambience_type": "forest",
  "duration_min": 20,
  "sleep_hours": 5.5,
  "energy_level": 3,
  "stress_level": 8,
  "time_of_day": "morning",
  "previous_day_mood": "restless",
  "face_emotion_hint": "tired_face"
}
```

**Response:**
```json
{
  "predicted_state": "overwhelmed",
  "predicted_intensity": 4,
  "confidence": 0.52,
  "uncertain_flag": 0,
  "what_to_do": "box_breathing",
  "when_to_do": "now",
  "supportive_message": "You seem quite overwhelmed right now. Let's slow things down — try a short breathing exercise now to reset your system.",
  "state_confidence": 0.54,
  "intensity_confidence": 0.49
}
```

### `POST /predict/batch`
Batch predictions for multiple records.

### `GET /health`
System health check — model status, classes, ablation results.

---

## 🧪 Model Details

### Dataset
| Property | Value |
|---|---|
| Train samples | 1200 |
| Test samples | 120 |
| Target 1 | emotional_state (6 classes) |
| Target 2 | intensity (1–5) |
| Missing data | face_emotion_hint (10.25%), previous_day_mood (1.25%) |

### Emotional State Classifier
| Property | Value |
|---|---|
| Model | XGBoost Classifier |
| Text Encoder | Sentence-BERT (all-MiniLM-L6-v2, local) |
| Feature Dims | 393 (384 text + 9 metadata) |
| Classes | calm, focused, mixed, neutral, overwhelmed, restless |
| Val Accuracy | 56.7% (random baseline = 16.7%) |
| Balancing | SMOTE oversampling |

### Intensity Estimator
| Property | Value |
|---|---|
| Approach | Hybrid (ML + rule-based fallback) |
| Fallback trigger | ML confidence < 0.45 |
| Why hybrid | Noisy intensity labels (~23% ML accuracy expected) |

### Decision Engine

Rule-based engine using state + intensity + stress + energy + time:

| State | High Stress | Low Energy | Default |
|---|---|---|---|
| calm | — | light_planning | journaling |
| focused | — | light_planning | deep_work |
| mixed | box_breathing | journaling | journaling |
| neutral | — | rest | light_planning |
| overwhelmed | box_breathing | grounding | grounding |
| restless | box_breathing | movement | movement |

### Uncertainty Modeling
- **Confidence** = average of state + intensity max class probability
- **Uncertain flag** = 1 if confidence < 0.50
- 77.5% of test predictions flagged uncertain — honest behavior for a noisy 6-class problem

### Ablation Study
| Model | CV Accuracy |
|---|---|
| Text Only (BERT) | 44.9% ± 15.7% |
| Text + Metadata | 42.7% ± 15.4% |

---

## 🔧 Robustness

| Scenario | How It's Handled |
|---|---|
| Very short text ("ok") | uncertain_flag=1, metadata-driven prediction |
| Missing values | Median/mode imputation at feature layer |
| Contradictory inputs | Rule-based engine overrides based on stress/energy |
| Unknown emotional state | Falls back to light_planning recommendation |

---

## 🚀 Deployment

| Layer | Platform | Status |
|---|---|---|
| Backend API | Render Web Service | ✅ Live |
| Frontend UI | Render Static Site | ✅ Live |
| ML Models | Retrained on Render at build time | ✅ |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Language | Python 3.12 |
| API Framework | FastAPI |
| ML Model | XGBoost |
| Text Embeddings | Sentence-BERT (all-MiniLM-L6-v2) |
| Feature Engineering | Scikit-learn + SMOTE |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Deployment | Render (backend + frontend) |
| Version Control | Git + GitHub |

---

## 📝 Additional Documentation

| File | Description |
|---|---|
| [ERROR_ANALYSIS.md](./ERROR_ANALYSIS.md) | 10 failure cases with root causes and fix strategies |
| [EDGE_PLAN.md](./EDGE_PLAN.md) | Mobile/on-device deployment strategy with ONNX + TF-IDF |
| [notebooks/eda_analysis.ipynb](./notebooks/eda_analysis.ipynb) | Full EDA with 8 visualization charts |

---

## 👤 Author

<div align="center">

**Aakarsh Kumar**

Final Year B.Tech — Artificial Intelligence
Gautam Buddha University

[![GitHub](https://img.shields.io/badge/GitHub-Aakarshkumar612-181717?style=flat-square&logo=github)](https://github.com/Aakarshkumar612)


**Dream > Innovate > Create ✦**

</div>