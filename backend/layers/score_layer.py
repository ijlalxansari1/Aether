# Add this to a new file: backend/layers/score.py

class ScoreLayer:
    def __init__(self, df, eda_result: dict, ethical_result: dict):
        self.df = df
        self.eda = eda_result
        self.ethical = ethical_result

    def process(self) -> float:
        # Completeness — avg non-null across all columns
        cols = self.eda.get("columns", [])
        if not cols:
            return 0.0

        completeness = 1 - (
            sum(c["missing_percent"] for c in cols) / len(cols) / 100
        )

        # Duplicate penalty
        try:
            dup_pct = self.df.duplicated().sum() / len(self.df)
        except Exception:
            dup_pct = 0.0

        # Ethics penalty
        risk_penalty = {"Low": 0.0, "Medium": 0.05, "High": 0.15}
        penalty = risk_penalty.get(
            self.ethical.get("risk_level", "Low"), 0.0
        )

        raw = (completeness * 0.7) + ((1 - dup_pct) * 0.3) - penalty
        return round(max(0.0, min(raw, 1.0)) * 100, 1)  # 0–100