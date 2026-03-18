# Edge & Offline Deployment Plan — Lumina Emotional Intelligence System

> Strategy for running the full Lumina pipeline on mobile devices and edge hardware
> without internet connectivity, while maintaining acceptable accuracy and latency.

---

## Current Architecture (Cloud/Server)

```
Mobile App
    │
    │ HTTPS POST /predict
    ▼
FastAPI on Render (Cloud)
    │
    ├── Sentence-BERT (all-MiniLM-L6-v2, 90MB)
    ├── XGBoost Classifier (state, 5MB)
    ├── XGBoost Classifier (intensity, 5MB)
    └── Rule-based Decision Engine
    │
    ▼
JSON Response → Mobile App
```

**Current Stats:**
- Total model size: ~200MB
- Round-trip latency: 300–800ms (network + inference)
- Requires: active internet connection
- Privacy: journal text sent to external server

**Problems for Edge:**
- 200MB is too large for on-device deployment
- Network dependency breaks offline wellness use cases
- Privacy: sensitive mental health data leaving the device

---

## Target Edge Architecture

```
Mobile App
    │
    ├── Network available? ──YES──► Cloud API (full accuracy, BERT)
    │
    └── Offline / Low bandwidth ──► On-Device Engine (lighter model)
            │
            ├── TF-IDF + SVD Encoder (2MB, replaces BERT)
            ├── ONNX XGBoost (state, 3MB)
            ├── ONNX XGBoost (intensity, 3MB)
            └── JSON Decision Rules (10KB)
            │
            ▼
        Response in <50ms, no network needed
```

---

## Step-by-Step Edge Migration Plan

### Step 1 — Replace Sentence-BERT with TF-IDF + TruncatedSVD

**Why:** Sentence-BERT (90MB) is the main size bottleneck. TF-IDF + SVD produces a 100-dimensional text representation that is 45x smaller with only ~8% accuracy drop.

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.pipeline import Pipeline
import joblib

# Train the lightweight text encoder
text_encoder = Pipeline([
    ('tfidf', TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 2),
        min_df=2,
        sublinear_tf=True
    )),
    ('svd', TruncatedSVD(n_components=100, random_state=42))
])

X_text_light = text_encoder.fit_transform(train_df['journal_text'])
joblib.dump(text_encoder, 'artifacts/text_encoder_light.pkl')
# Size: ~2MB vs 90MB for BERT
```

**Accuracy comparison:**
| Encoder | Model Size | CV Accuracy |
|---|---|---|
| Sentence-BERT | 90MB | 44.9% (text-only) |
| TF-IDF + SVD (100d) | 2MB | ~37-40% (estimated) |
| TF-IDF + SVD (50d) | 1MB | ~33-36% (estimated) |

The ~7% accuracy drop is acceptable for offline mode — users are informed it is the offline version.

---

### Step 2 — Export XGBoost Models to ONNX

ONNX (Open Neural Network Exchange) format runs natively on iOS (CoreML), Android (NNAPI), and WebAssembly — no Python needed.

```python
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
import onnx

# Export state classifier
# Feature dims for edge: 100 (SVD text) + 9 (metadata) = 109
initial_type = [('float_input', FloatTensorType([None, 109]))]

onnx_state = convert_sklearn(
    state_model,
    initial_types=initial_type,
    target_opset=12
)
with open('artifacts/state_classifier_edge.onnx', 'wb') as f:
    f.write(onnx_state.SerializeToString())

# Export intensity classifier
onnx_intensity = convert_sklearn(
    intensity_model,
    initial_types=initial_type,
    target_opset=12
)
with open('artifacts/intensity_classifier_edge.onnx', 'wb') as f:
    f.write(onnx_intensity.SerializeToString())

print("ONNX models exported successfully")
```

**ONNX Runtime performance:**
- ~3x faster than Python XGBoost on CPU
- Available for: Android (Java/Kotlin), iOS (Swift), React Native (JS), WebAssembly

---

### Step 3 — Export Decision Rules to JSON

The decision engine is pure Python rules. Export them as a JSON file that can be loaded by any platform (Android, iOS, JavaScript).

```python
import json

decision_rules = {
    "what_rules": {
        "calm":        {"high_energy": "deep_work", "low_energy": "light_planning", "default": "journaling"},
        "focused":     {"high_energy": "deep_work", "low_energy": "light_planning", "default": "deep_work"},
        "mixed":       {"high_stress": "box_breathing", "low_energy": "journaling", "default": "journaling"},
        "neutral":     {"high_energy": "deep_work", "low_energy": "rest", "default": "light_planning"},
        "overwhelmed": {"high_stress": "box_breathing", "low_energy": "grounding", "default": "grounding"},
        "restless":    {"high_stress": "box_breathing", "low_energy": "movement", "default": "movement"}
    },
    "when_rules": {
        "morning":   {"5": "now", "4": "now", "3": "within_15_min", "2": "within_15_min", "1": "later_today"},
        "afternoon": {"5": "now", "4": "within_15_min", "3": "within_15_min", "2": "later_today", "1": "later_today"},
        "evening":   {"5": "now", "4": "within_15_min", "3": "tonight", "2": "tonight", "1": "tonight"},
        "night":     {"5": "now", "4": "tonight", "3": "tonight", "2": "tomorrow_morning", "1": "tomorrow_morning"}
    },
    "thresholds": {
        "high_stress": 7,
        "low_energy": 3,
        "high_energy": 7,
        "uncertain_confidence": 0.50,
        "urgent_states": ["overwhelmed", "restless", "mixed"],
        "urgent_intensity_threshold": 4
    }
}

with open('artifacts/decision_rules.json', 'w') as f:
    json.dump(decision_rules, f, indent=2)
```

Size: ~10KB. Runs identically on every platform with zero ML dependencies.

---

### Step 4 — Export Imputation Constants

All missing value defaults must be exported so edge devices can apply the same preprocessing without Python sklearn.

```python
import json
import numpy as np

imputation_constants = {
    "numerical_medians": {
        "duration_min": float(train_df['duration_min'].median()),
        "sleep_hours":  float(train_df['sleep_hours'].median()),
        "energy_level": float(train_df['energy_level'].median()),
        "stress_level": float(train_df['stress_level'].median())
    },
    "categorical_modes": {
        "ambience_type":     train_df['ambience_type'].mode()[0],
        "time_of_day":       train_df['time_of_day'].mode()[0],
        "previous_day_mood": train_df['previous_day_mood'].mode()[0],
        "face_emotion_hint": train_df['face_emotion_hint'].mode()[0],
        "reflection_quality":train_df['reflection_quality'].mode()[0]
    },
    "scaler_means": feature_eng.scaler.mean_.tolist(),
    "scaler_stds":  feature_eng.scaler.scale_.tolist()
}

with open('artifacts/imputation_constants.json', 'w') as f:
    json.dump(imputation_constants, f, indent=2)
```

---

## Platform-Specific Integration

### Android (Kotlin/Java)

```kotlin
// Add to build.gradle
implementation 'com.microsoft.onnxruntime:onnxruntime-android:1.16.0'

// Inference
val ortEnvironment = OrtEnvironment.getEnvironment()
val session = ortEnvironment.createSession(
    assets.open("state_classifier_edge.onnx").readBytes()
)

val inputFeatures = preprocessInput(journalText, metadata) // Float array, dim=109
val inputTensor = OnnxTensor.createTensor(ortEnvironment, 
    FloatBuffer.wrap(inputFeatures), longArrayOf(1, 109))

val result = session.run(mapOf("float_input" to inputTensor))
val probabilities = (result[0].value as Array<FloatArray>)[0]
val predictedClass = probabilities.indices.maxByOrNull { probabilities[it] }!!
```

Latency on mid-range Android: **15–30ms**

---

### iOS (Swift)

```swift
import CoreML
import OnnxRuntimeBindings

// Convert ONNX to CoreML (run once, offline)
// coremltools.convert('state_classifier_edge.onnx') → .mlmodel

// iOS inference
let model = try! LuminaStateClassifier(configuration: MLModelConfiguration())
let input = LuminaStateClassifierInput(float_input: inputMLArray)
let output = try! model.prediction(input: input)
let predictedState = stateClasses[output.classLabel]
```

Latency on iPhone 12+: **10–20ms**

---

### React Native (JavaScript)

```javascript
import { InferenceSession, Tensor } from 'onnxruntime-react-native';

const session = await InferenceSession.create(
  require('./assets/state_classifier_edge.onnx')
);

const inputTensor = new Tensor('float32', inputFeatures, [1, 109]);
const feeds = { float_input: inputTensor };
const results = await session.run(feeds);
const probabilities = results['probabilities'].data;
```

Latency on mid-range device: **20–40ms**

---

## Complete Edge Model Size Breakdown

| Component | Cloud Version | Edge Version | Reduction |
|---|---|---|---|
| Text encoder | BERT (90MB) | TF-IDF+SVD (2MB) | 97.8% smaller |
| State classifier | XGBoost pkl (5MB) | ONNX (3MB) | 40% smaller |
| Intensity classifier | XGBoost pkl (5MB) | ONNX (3MB) | 40% smaller |
| Decision engine | Python module | JSON (10KB) | 99.9% smaller |
| Imputation | sklearn pkl (1MB) | JSON constants (5KB) | 99.5% smaller |
| Feature encoder | sklearn pkl (1MB) | JSON mappings (50KB) | 95% smaller |
| **Total** | **~202MB** | **~8MB** | **96% smaller** |

---

## Latency Targets by Device

| Device Tier | Cloud Mode | Edge Mode | Offline Mode |
|---|---|---|---|
| High-end (Pixel 8, iPhone 15) | 200–300ms | 10–20ms | 10–20ms |
| Mid-range (Pixel 6a, iPhone 12) | 250–400ms | 20–40ms | 20–40ms |
| Low-end (budget Android) | 300–600ms | 50–100ms | 50–100ms |

---

## Offline-First Product Design

### Network Decision Logic
```
App opens
    │
    ├── Check connectivity
    │       │
    │       ├── WiFi/4G available → use Cloud API (full BERT, higher accuracy)
    │       │                       Show: "✦ Full AI Mode"
    │       │
    │       └── Offline/Poor signal → use On-Device Engine
    │                                 Show: "⚡ Offline Mode (lighter model)"
    │
    └── Cache last result in SQLite for review without connectivity
```

### User Communication
- Show a subtle badge: "Full AI" (online) vs "Offline Mode" (edge)
- In offline mode, show: "Using lightweight local model. Connect to internet for enhanced accuracy."
- Never silently degrade — always inform the user which mode is active

---

## Privacy Architecture

### Cloud Mode Privacy
- Journal text sent to Render server (FastAPI)
- Data is not stored (stateless API)
- HTTPS encryption in transit
- No logging of prediction content

### Edge Mode Privacy (Gold Standard)
- **Journal text never leaves the device**
- All processing happens locally in RAM
- No network requests made at all
- GDPR/CCPA compliant by design
- This is the recommended mode for sensitive users

**Privacy is a feature, not an afterthought.** For a mental wellness application handling emotional and psychological data, on-device processing is the gold standard. Edge deployment enables Lumina to handle the most sensitive user data responsibly.

---

## Robustness on Edge

### Very Short Text ("ok", "fine")
- TF-IDF produces near-zero vector → L2 norm < 0.1
- System detects low text informativeness → sets uncertain_flag = 1
- Falls back to pure metadata prediction (no text features used)
- Decision engine still produces valid what/when recommendation

### Missing Values
- All imputation values (medians, modes) are exported as JSON constants at training time
- Edge device performs simple lookup substitution — no sklearn dependency
- Zero runtime computation overhead for missing value handling

### Contradictory Inputs
- Decision engine is pure JSON rule lookup — identical behavior on cloud and edge
- Hybrid intensity estimator logic exported as explicit if-else rules
- No ML model required for what/when decisions

### No Internet, No Problem
- TF-IDF vocabulary and SVD matrix exported as JSON + numpy binary
- ONNX models run without any Python, PyTorch, or sklearn dependency
- Full prediction pipeline available with zero network calls

---

## Deployment Checklist

### To enable edge mode, produce these artifacts:
```
artifacts/
├── text_encoder_light.pkl        ← TF-IDF + SVD (Python fallback)
├── tfidf_vocabulary.json         ← For non-Python platforms
├── svd_matrix.npy                ← For non-Python platforms
├── state_classifier_edge.onnx    ← ONNX state model
├── intensity_classifier_edge.onnx ← ONNX intensity model
├── decision_rules.json           ← Platform-agnostic rules
├── imputation_constants.json     ← Missing value defaults
└── label_mappings.json           ← Class index → label name
```

### Add to React Native app:
- `onnxruntime-react-native` package
- All ONNX + JSON artifacts bundled in `assets/`
- Network detection hook
- Mode indicator UI component

---

## Summary

Edge deployment transforms Lumina from a cloud-dependent service into a **privacy-first, always-available** mental wellness companion. The key tradeoffs are:

| Dimension | Cloud | Edge |
|---|---|---|
| Accuracy | Higher (~57%) | Slightly lower (~50%) |
| Latency | 300-800ms | 10-50ms |
| Privacy | Server processes text | Text never leaves device |
| Availability | Requires internet | Always available |
| Model size | ~200MB (server) | ~8MB (on-device) |
| Battery impact | Network calls | Local inference (minimal) |

**Recommendation:** Ship both modes. Default to cloud for accuracy, fall back to edge for privacy and offline reliability. Let users choose their preferred mode in settings.