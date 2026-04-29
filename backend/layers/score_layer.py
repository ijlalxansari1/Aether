import pandas as pd


class ScoreLayer:
    def __init__(self, df: pd.DataFrame, eda_result: dict, ethical_result: dict,
                 quality_result: dict = None):
        self.df = df
        self.eda = eda_result
        self.ethical = ethical_result
        self.quality = quality_result or {}

    def process(self) -> dict:
        """
        IQ Score: 0–100. Weighted across 4 signal groups.
        Returns the score AND a breakdown so the frontend can show why.

        Weights:
          Completeness  40%  — is the data actually there?
          Cleanliness   25%  — duplicates, constant cols, outliers
          Balance       20%  — class imbalance in categorical cols
          Ethics        15%  — risk level from ethical layer
        """
        cols = self.eda.get("columns", [])
        if not cols:
            return {"score": 0.0, "breakdown": {}, "verdict": "Insufficient data"}

        total_rows = len(self.df)

        # ── Signal 1: Completeness (40%) ──────────────────────────────────
        # Cell-level accuracy — same formula as corrected QualityLayer
        try:
            total_cells = total_rows * len(self.df.columns)
            null_cells = int(self.df.isnull().sum().sum())
            completeness = (1 - null_cells / total_cells) if total_cells > 0 else 1.0
        except Exception:
            completeness = 1.0

        # ── Signal 2: Cleanliness (25%) ───────────────────────────────────
        # Combines: duplicate rate + constant columns + outlier presence

        # Duplicate rate
        try:
            dup_rate = self.df.astype(str).duplicated().sum() / total_rows if total_rows > 0 else 0.0
        except Exception:
            dup_rate = 0.0

        # Constant columns — read from quality layer if available, else recompute
        constant_cols = self.quality.get("metrics", {}).get("constant_columns", [])
        if not constant_cols:
            try:
                constant_cols = [
                    col for col in self.df.columns
                    if self.df[col].astype(str).nunique() <= 1
                ]
            except Exception:
                constant_cols = []
        constant_penalty = min(len(constant_cols) * 0.05, 0.20)  # cap at 20%

        # Outlier rate — read from EDA _stats
        outlier_cols_count = sum(
            1 for c in cols
            if c.get("type") == "numeric" and c.get("_stats", {}).get("outlier_count", 0) > 0
        )
        outlier_penalty = min(outlier_cols_count * 0.03, 0.15)  # cap at 15%

        cleanliness = max(0.0, (1 - dup_rate) - constant_penalty - outlier_penalty)

        # ── Signal 3: Balance (20%) ───────────────────────────────────────
        # Reads imbalance from quality layer if available
        imbalanced = self.quality.get("metrics", {}).get("imbalanced_columns", [])
        if not isinstance(imbalanced, list):
            imbalanced = []

        # Fallback: check categorical columns directly
        if not imbalanced:
            for c in cols:
                if c.get("type") == "categorical" and c["name"] in self.df.columns:
                    try:
                        top = self.df[c["name"]].astype(str).value_counts(normalize=True)
                        if not top.empty and top.iloc[0] > 0.8:
                            imbalanced.append(c["name"])
                    except Exception:
                        pass

        categorical_count = sum(1 for c in cols if c.get("type") == "categorical")
        if categorical_count > 0:
            imbalance_ratio = len(imbalanced) / categorical_count
            balance = 1 - imbalance_ratio
        else:
            balance = 1.0  # no categorical columns = no imbalance issue

        # ── Signal 4: Ethics (15%) ────────────────────────────────────────
        risk_map = {"Low": 1.0, "Medium": 0.65, "High": 0.30}
        risk_level = self.ethical.get("risk_level", "Low") if isinstance(self.ethical, dict) else "Low"
        ethics_score = risk_map.get(risk_level, 1.0)

        # ── Weighted IQ Score ─────────────────────────────────────────────
        raw = (
            completeness  * 0.40 +
            cleanliness   * 0.25 +
            balance       * 0.20 +
            ethics_score  * 0.15
        )
        iq = round(max(0.0, min(raw, 1.0)) * 100, 1)

        # ── Verdict ───────────────────────────────────────────────────────
        if iq >= 85:
            verdict = "Production Ready"
        elif iq >= 70:
            verdict = "Needs Minor Cleaning"
        elif iq >= 50:
            verdict = "Significant Issues"
        else:
            verdict = "Not Recommended for Use"

        return {
            "score": iq,
            "verdict": verdict,
            "breakdown": {
                "completeness": round(completeness * 100, 1),
                "cleanliness":  round(cleanliness * 100, 1),
                "balance":      round(balance * 100, 1),
                "ethics":       round(ethics_score * 100, 1),
            },
            "signals": {
                "null_cells":        null_cells,
                "duplicate_rate":    round(dup_rate * 100, 2),
                "constant_columns":  len(constant_cols),
                "outlier_columns":   outlier_cols_count,
                "imbalanced_columns": len(imbalanced),
                "ethics_risk":       risk_level,
            }
        }