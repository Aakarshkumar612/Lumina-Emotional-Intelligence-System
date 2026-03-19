const API_BASE = import.meta.env.VITE_API_URL || "https://lumina-emotional-intelligence-system.onrender.com";

export interface EmotionPayload {
  journal_text: string;
  ambience_type: string;
  duration_min: number;
  sleep_hours: number | null;
  energy_level: number;
  stress_level: number;
  time_of_day: string;
  previous_day_mood: string | null;
  face_emotion_hint: string | null;
  reflection_quality: string;
}

export interface PredictionResult {
  predicted_state: string;
  confidence: number;
  intensity: number;
  is_uncertain: boolean;
  what_to_do: string;
  when_to_do: string;
  supportive_message: string;
}

export async function analyzeEmotion(formData: Record<string, any>): Promise<PredictionResult> {
  const payload: EmotionPayload = {
    journal_text: formData.journalText || "",
    ambience_type: formData.ambienceType || "forest",
    duration_min: parseFloat(formData.durationMin) || 20,
    sleep_hours: formData.sleepHours ? parseFloat(formData.sleepHours) : null,
    energy_level: parseFloat(formData.energyLevel) || 5,
    stress_level: parseFloat(formData.stressLevel) || 5,
    time_of_day: formData.timeOfDay || "morning",
    previous_day_mood: formData.previousMood !== "none" ? formData.previousMood : null,
    face_emotion_hint: formData.faceEmotionHint !== "none" ? formData.faceEmotionHint : null,
    reflection_quality: "clear",
  };

  const response = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Prediction failed" }));
    throw new Error(error.detail || "Prediction failed");
  }

  return response.json();
}
