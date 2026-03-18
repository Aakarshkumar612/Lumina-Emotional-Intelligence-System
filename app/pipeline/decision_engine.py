from typing import Tuple


# Based on actual dataset classes:
# calm, focused, mixed, neutral, overwhelmed, restless

WHAT_RULES = {
    "calm": {
        "high_energy": "deep_work",
        "low_energy":  "light_planning",
        "default":     "journaling"
    },
    "focused": {
        "high_energy": "deep_work",
        "low_energy":  "light_planning",
        "default":     "deep_work"
    },
    "mixed": {
        "high_stress": "box_breathing",
        "low_energy":  "journaling",
        "default":     "journaling"
    },
    "neutral": {
        "high_energy": "deep_work",
        "low_energy":  "rest",
        "default":     "light_planning"
    },
    "overwhelmed": {
        "high_stress": "box_breathing",
        "low_energy":  "grounding",
        "default":     "grounding"
    },
    "restless": {
        "high_stress": "box_breathing",
        "low_energy":  "movement",
        "default":     "movement"
    },
}

WHEN_RULES = {
    "morning": {
        5: "now",
        4: "now",
        3: "within_15_min",
        2: "within_15_min",
        1: "later_today"
    },
    "afternoon": {
        5: "now",
        4: "within_15_min",
        3: "within_15_min",
        2: "later_today",
        1: "later_today"
    },
    "evening": {
        5: "now",
        4: "within_15_min",
        3: "tonight",
        2: "tonight",
        1: "tonight"
    },
    "night": {
        5: "now",
        4: "tonight",
        3: "tonight",
        2: "tomorrow_morning",
        1: "tomorrow_morning"
    },
}

URGENT_STATES = {"overwhelmed", "restless", "mixed"}


class DecisionEngine:

    def decide(
        self,
        predicted_state: str,
        intensity: int,
        stress_level: float,
        energy_level: float,
        time_of_day: str,
    ) -> Tuple[str, str]:
        state     = predicted_state.lower().strip()
        intensity = int(max(1, min(5, round(intensity))))

        what = self._decide_what(state, stress_level, energy_level)
        when = self._decide_when(state, intensity, time_of_day)

        return what, when

    def _decide_what(self, state, stress_level, energy_level) -> str:
        rules       = WHAT_RULES.get(state, {"default": "light_planning"})
        high_stress = stress_level >= 7
        low_energy  = energy_level <= 3
        high_energy = energy_level >= 7

        if high_stress and "high_stress" in rules:
            return rules["high_stress"]
        if low_energy and "low_energy" in rules:
            return rules["low_energy"]
        if high_energy and "high_energy" in rules:
            return rules["high_energy"]
        return rules.get("default", "light_planning")

    def _decide_when(self, state, intensity, time_of_day) -> str:
        if state in URGENT_STATES and intensity >= 4:
            return "now"
        time     = time_of_day.lower().strip()
        time_map = WHEN_RULES.get(time, WHEN_RULES["afternoon"])
        return time_map.get(intensity, "within_15_min")

    def estimate_intensity(
        self,
        ml_prediction: int,
        ml_confidence: float,
        stress_level: float,
        energy_level: float,
        predicted_state: str
    ) -> int:
        """
        Hybrid intensity estimator.
        When ML confidence is low, fall back to rule-based
        estimation using stress + energy signals.
        """
        if ml_confidence >= 0.45:
            return int(ml_prediction)

        state = predicted_state.lower()

        if state in ("overwhelmed", "restless", "mixed"):
            if stress_level >= 8:
                return 5
            elif stress_level >= 6:
                return 4
            elif stress_level >= 4:
                return 3
            else:
                return 2

        if state in ("calm", "focused"):
            if energy_level >= 7:
                return 2
            else:
                return 1

        if state == "neutral":
            if stress_level >= 7:
                return 3
            else:
                return 2

        return 3

    def generate_message(
        self,
        predicted_state: str,
        intensity: int,
        what: str,
        when: str
    ) -> str:
        intensity_word = {
            1: "mildly",
            2: "slightly",
            3: "moderately",
            4: "quite",
            5: "very"
        }
        feeling      = intensity_word.get(intensity, "somewhat")
        what_display = what.replace("_", " ")
        when_display = when.replace("_", " ")

        templates = {
            "box_breathing":  f"You seem {feeling} {predicted_state} right now. Let's slow things down — try a short breathing exercise {when_display} to reset your system.",
            "journaling":     f"You appear {feeling} {predicted_state}. Writing your thoughts {when_display} can bring clarity and release what's weighing on you.",
            "deep_work":      f"You're feeling {feeling} {predicted_state} — a great state for focused work. Channel this {when_display}.",
            "grounding":      f"You seem {feeling} {predicted_state}. A short grounding exercise {when_display} will help you reconnect with the present moment.",
            "rest":           f"Your mind seems {feeling} {predicted_state}. Prioritize rest {when_display} — recovery is productive.",
            "movement":       f"You seem {feeling} {predicted_state}. Light movement {when_display} will help shift and release that energy.",
            "light_planning": f"You're feeling {feeling} {predicted_state}. A bit of light planning {when_display} will give you a gentle sense of direction.",
            "sound_therapy":  f"You seem {feeling} {predicted_state}. Try calming sound therapy {when_display} to soothe your mind.",
            "yoga":           f"You seem {feeling} {predicted_state}. A gentle yoga session {when_display} could help restore your balance.",
            "pause":          f"You seem {feeling} {predicted_state}. Sometimes a mindful pause {when_display} is exactly what you need.",
        }

        return templates.get(
            what,
            f"You seem {feeling} {predicted_state}. Consider {what_display} {when_display} to support your wellbeing."
        )