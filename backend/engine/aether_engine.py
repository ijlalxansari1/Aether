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


# ── Vector weight config ──────────────────────────────────────────
# Each value is a depth multiplier passed to layers (1.0 = full depth)
VECTOR_WEIGHTS = {
    "exploratory": {"eda": 1.0, "ethical": 0.8, "quality": 0.6, "feature": 0.4, "story": 0.6},
    "ml_focused":  {"eda": 0.6, "ethical": 0.8, "quality": 1.0, "feature": 1.0, "story": 0.4},
    "business":    {"eda": 0.4, "ethical": 0.8, "quality": 0.8, "feature": 0.4, "story": 1.0},
    "cleaning":    {"eda": 0.8, "ethical": 0.6, "quality": 1.0, "feature": 0.2, "story": 0.6},
}

DEFAULT_WEIGHTS = {"eda": 0.8, "ethical": 0.8, "quality": 0.8, "feature": 0.8, "story": 0.8}


class AetherEngine:
    def __init__(self, df: pd.DataFrame, intent: str = "exploratory"):
        self.df = df
        self.intent = intent.lower().strip()
        self.session_id = str(uuid.uuid4())
        self.profile = self._detect_profile()
        self.weights = VECTOR_WEIGHTS.get(self.intent, DEFAULT_WEIGHTS)

    def _detect_profile(self) -> str:
        """
        Determine dataset's dominant nature.
        Uses ratio-based detection — not greedy first-match.
        """
        total = self.df.shape[1]
        if total == 0:
            return "empty"

        numeric_count = self.df.select_dtypes(include="number").shape[1]
        numeric_ratio = numeric_count / total

        if numeric_ratio > 0.6:
            return "numerical"
        elif numeric_ratio < 0.4:
            return "categorical_heavy"
        return "mixed"

    def _run_layer(self, name: str, fn) -> Optional[dict]:
        """
        Safely execute a single layer.
        If it crashes, log the error and return a fallback dict —
        the rest of the pipeline continues unaffected.
        """
        try:
            return fn()
        except Exception as e:
            logger.error(f"[{self.session_id}] Layer '{name}' failed: {e}", exc_info=True)
            return {"error": f"{name} layer failed", "details": str(e)}

    def run(self) -> dict:
        """
        Adaptive Intelligence Pipeline v3.5 Dynamic
        Order: EDA → Ethical → Quality → Feature → Insights → Story → Score
        
        Each layer receives results from prior layers where relevant.
        Ethical results feed into Quality (ethics penalty for IQ score).
        All results feed into Story for unified narrative generation.
        """
        logger.info(f"[{self.session_id}] Pipeline started | intent={self.intent} | profile={self.profile}")

        # ── Layer 1: EDA ─────────────────────────────────────────
        eda = self._run_layer("eda", lambda: EDALayer(self.df).process())

        # Profile-aware EDA notes
        if "error" not in eda:
            if self.profile == "numerical":
                eda["note"] = "Numerical dataset — statistical modeling supported. Consider non-linear correlation scans."
            elif self.profile == "categorical_heavy":
                eda["note"] = "Categorical-heavy dataset — encoding required before ML. Check cardinality."
            else:
                eda["note"] = "Mixed dataset — run both statistical and categorical analysis tracks."

        # ── Layer 2: Ethical ─────────────────────────────────────
        ethical = self._run_layer("ethical", lambda: EthicalLayer(self.df).process())

        # ── Layer 3: Quality (receives EDA + Ethical for IQ score)
        quality = self._run_layer(
            "quality",
            lambda: QualityLayer(self.df).process(eda)
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
        iq_score = self._run_layer(
            "score",
            lambda: ScoreLayer(self.df, eda, ethical).process()
        )

        logger.info(f"[{self.session_id}] Pipeline complete | iq_score={iq_score}")

        return {
            "session_id":  self.session_id,
            "intent":      self.intent,
            "profile":     self.profile,
            "iq_score":    iq_score,
            "eda":         eda,
            "ethical":     ethical,
            "quality":     quality,
            "features":    features,
            "insights":    insights,
            "story":       story,
        }