import pandas as pd
import uuid
import logging
from typing import Optional

from layers.eda_layer import EDALayer
from layers.ethical_layer import EthicalLayer
from layers.quality_layer import QualityLayer
from layers.feature_layer import FeatureLayer
from layers.story_layer import StoryLayer
from layers.insights_layer import InsightsLayer
from layers.score_layer import ScoreLayer

logger = logging.getLogger("aether.engine")


VALID_INTENTS = {"exploratory", "ml", "business", "cleaning"}

VECTOR_WEIGHTS = {
    "exploratory": {"eda": 1.0, "ethical": 0.8, "quality": 0.6, "feature": 0.4, "story": 0.6},
    "ml":          {"eda": 0.6, "ethical": 0.8, "quality": 1.0, "feature": 1.0, "story": 0.4},
    "business":    {"eda": 0.4, "ethical": 0.8, "quality": 0.8, "feature": 0.4, "story": 1.0},
    "cleaning":    {"eda": 0.8, "ethical": 0.6, "quality": 1.0, "feature": 0.2, "story": 0.6},
}

DEFAULT_WEIGHTS = {"eda": 0.8, "ethical": 0.8, "quality": 0.8, "feature": 0.8, "story": 0.8}


class AetherEngine:
    def __init__(self, df: pd.DataFrame, intent: str = "exploratory", mode: str = "exploratory"):
        self.df = df
        self.intent = intent.lower().strip() if intent.lower().strip() in VALID_INTENTS else "exploratory"
        self.mode = mode
        self.session_id = str(uuid.uuid4())
        self.profile = self._detect_profile()
        self.weights = VECTOR_WEIGHTS.get(self.intent, DEFAULT_WEIGHTS)

    def _detect_profile(self) -> str:
        total = self.df.shape[1]
        if total == 0:
            return "empty"
        numeric_ratio = self.df.select_dtypes(include="number").shape[1] / total
        if numeric_ratio > 0.6:
            return "numerical"
        elif numeric_ratio < 0.4:
            return "categorical_heavy"
        return "mixed"

    def _run_layer(self, name: str, fn) -> Optional[dict]:
        try:
            return fn()
        except Exception as e:
            logger.error(
                f"[{self.session_id}] Layer '{name}' failed: {type(e).__name__}: {e}",
                exc_info=True
            )
            return {"error": f"{name} layer unavailable", "status": "failed"}

    def run(self) -> dict:
        logger.info(
            f"[{self.session_id}] Pipeline started | intent={self.intent} "
            f"| mode={self.mode} | profile={self.profile}"
        )

        # ── Layer 1: EDA ─────────────────────────────────────────
        # FIX 1: mode now passed through
        eda = self._run_layer(
            "eda",
            lambda: EDALayer(self.df, mode=self.mode).process()
        )

        if "error" not in eda:
            if self.profile == "numerical":
                eda["note"] = "Numerical dataset — statistical modeling supported. Consider non-linear correlation scans."
            elif self.profile == "categorical_heavy":
                eda["note"] = "Categorical-heavy dataset — encoding required before ML. Check cardinality."
            else:
                eda["note"] = "Mixed dataset — run both statistical and categorical analysis tracks."

        # ── Layer 2: Ethical ─────────────────────────────────────
        ethical = self._run_layer(
            "ethical",
            lambda: EthicalLayer(self.df).process()
        )

        # ── Layer 3: Quality ─────────────────────────────────────
        # FIX 2: ethical now passed — matches updated QualityLayer signature
        quality = self._run_layer(
            "quality",
            lambda: QualityLayer(self.df).process(eda, ethical)
        )

        # ── Layer 4: Feature ─────────────────────────────────────
        features = self._run_layer(
            "feature",
            lambda: FeatureLayer(self.df).process(eda)
        )

        # ── Layer 5: Insights ────────────────────────────────────
        insights = self._run_layer(
            "insights",
            lambda: InsightsLayer(self.df).process(eda, self.intent, self.profile)
        )

        # ── Layer 6: Story ───────────────────────────────────────
        story = self._run_layer(
            "story",
            lambda: StoryLayer().generate(
                eda, ethical, quality, features, self.intent, self.profile
            )
        )

        # ── IQ Score ─────────────────────────────────────────────
        # FIX 3: quality now passed — ScoreLayer uses it to avoid recomputing
        iq_score = self._run_layer(
            "score",
            lambda: ScoreLayer(self.df, eda, ethical, quality).process()
        )

        logger.info(
            f"[{self.session_id}] Pipeline complete "
            f"| iq_score={iq_score.get('score') if isinstance(iq_score, dict) else iq_score}"
        )

        return {
            "session_id": self.session_id,
            "intent":     self.intent,
            "mode":       self.mode,
            "profile":    self.profile,
            "iq_score":   iq_score,
            "eda":        eda,
            "ethical":    ethical,
            "quality":    quality,
            "features":   features,
            "insights":   insights,
            "story":      story,
        }
