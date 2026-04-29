import pandas as pd
import numpy as np


class EDALayer:
    def __init__(self, df: pd.DataFrame, mode: str = "exploratory"):
        self.df = df
        # Mode controls how much depth we compute.
        # "exploratory", "ml", "business", "cleaning"
        self.mode = mode.lower()

    def process(self) -> dict:
        rows, cols = self.df.shape
        summary = {"rows": rows, "columns": cols}

        if self.df.empty or cols == 0:
            return {"summary": summary, "columns": [], "_correlations": {}}

        columns_info = []
        for col in self.df.columns:
            col_str = str(col)
            col_lower = col_str.lower()
            series = self.df[col]

            # ── Type Detection ───────────────────────────────────────────────
            col_type = self._detect_type(series)

            # ── Missingness ──────────────────────────────────────────────────
            missing_count = int(series.isnull().sum())
            missing_percent = round(float(missing_count / rows * 100), 2) if rows > 0 else 0.0
            has_vals = missing_count < rows

            # ── Stats (depth depends on mode) ────────────────────────────────
            stats = {}
            if col_type == "numeric" and has_vals:
                stats = self._numeric_stats(series)
            elif col_type == "categorical" and has_vals:
                stats = self._categorical_stats(series, rows)

            # ── Interpretive Notes ───────────────────────────────────────────
            notes = self._interpret(col_lower, col_type, missing_percent, has_vals, stats, rows)

            columns_info.append({
                "name": col_str,
                "type": col_type,
                "missing_percent": missing_percent,
                # Human-readable missingness label — new
                "missing_severity": self._missing_severity(missing_percent),
                "notes": notes,
                "_stats": stats,
            })

        correlations = self._correlations()

        return {
            "summary": {
                **summary,
                # Dataset-level health score — new
                "health_score": self._health_score(columns_info),
                "mode": self.mode,
            },
            "columns": columns_info,
            "_correlations": correlations,
        }

    # ── Type Detection ────────────────────────────────────────────────────────
    def _detect_type(self, series: pd.Series) -> str:
        try:
            if pd.api.types.is_numeric_dtype(series):
                return "numeric"
            if pd.api.types.is_datetime64_any_dtype(series):
                return "datetime"
            # Try parsing strings as dates
            sample = series.dropna()
            if not sample.empty:
                parsed = pd.to_datetime(sample, errors="coerce")
                if parsed.notna().mean() >= 0.8:
                    return "datetime"
            return "categorical"
        except Exception:
            return "categorical"

    # ── Numeric Stats ─────────────────────────────────────────────────────────
    def _numeric_stats(self, series: pd.Series) -> dict:
        clean = series.dropna()

        # Base stats — always computed
        stats = {
            "mean":   self._safe_float(clean.mean()),
            "median": self._safe_float(clean.median()),   # NEW — more robust than mean
            "min":    self._safe_float(clean.min()),
            "max":    self._safe_float(clean.max()),
            "std":    self._safe_float(clean.std()),      # NEW — spread of data
        }

        # ML mode: add skewness and outlier info
        # Skewness > 1 or < -1 means the data is lopsided — matters for ML models
        if self.mode in ("ml", "exploratory"):
            stats["skewness"] = self._safe_float(clean.skew())
            stats["outlier_count"] = self._count_outliers(clean)  # NEW

        # Cleaning mode: flag if column is constant (useless)
        if self.mode == "cleaning":
            stats["is_constant"] = bool(clean.nunique() <= 1)

        return stats

    # ── Categorical Stats ─────────────────────────────────────────────────────
    def _categorical_stats(self, series: pd.Series, total_rows: int) -> dict:
        str_series = series.astype(str)
        unique_count = int(str_series.nunique())

        stats = {
            "unique": unique_count,
            # Cardinality ratio: if close to 1.0, column is almost certainly an ID
            # NEW — helps catch disguised identifier columns
            "cardinality_ratio": round(unique_count / total_rows, 3) if total_rows > 0 else 0,
        }

        # Top value — useful for exploratory and business modes
        if self.mode in ("exploratory", "business"):
            top = str_series.value_counts()
            if not top.empty:
                stats["top_value"] = str(top.index[0])
                stats["top_value_freq_pct"] = round(float(top.iloc[0] / total_rows * 100), 2)

        return stats

    # ── Outlier Detection (IQR method) ────────────────────────────────────────
    # Think of this like a fence around "normal" values.
    # Anything outside the fence is flagged as an outlier.
    def _count_outliers(self, series: pd.Series) -> int:
        try:
            q1 = series.quantile(0.25)
            q3 = series.quantile(0.75)
            iqr = q3 - q1
            lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
            return int(((series < lower) | (series > upper)).sum())
        except Exception:
            return 0

    # ── Interpretive Notes ────────────────────────────────────────────────────
    def _interpret(self, col_lower, col_type, missing_pct, has_vals, stats, rows) -> str:
        if not has_vals:
            return "All null — drop this column"

        # Missingness interpretation — now actionable, not just a label
        if missing_pct > 50:
            return f"{missing_pct:.0f}% missing — strongly consider dropping"
        if missing_pct > 15:
            return f"{missing_pct:.0f}% missing — imputation recommended"

        # PII detection
        pii_keywords = ["name", "first_name", "last_name", "email", "phone", "contact", "address", "ssn", "dob", "passport"]
        if any(k in col_lower for k in pii_keywords):
            return "PII Detected — mask or exclude before sharing"

        # Identifier detection
        id_keywords = ["id", "uuid", "guid", "key"]
        if any(k == col_lower or col_lower.endswith(f"_{k}") or col_lower.startswith(f"{k}_") for k in id_keywords):
            return "Potential Identifier — exclude from ML features"

        # Categorical signals
        if col_type == "categorical":
            cardinality = stats.get("cardinality_ratio", 0)
            unique = stats.get("unique", 0)
            if cardinality > 0.9:
                return "Near-unique categorical — likely an ID column"
            if unique <= 1:
                return "Constant column — no predictive value"
            if unique <= 10:
                return f"Low cardinality ({unique} values) — good candidate for encoding"
            return "High cardinality categorical — consider grouping rare values"

        # Numeric signals
        if col_type == "numeric":
            skew = stats.get("skewness")
            outliers = stats.get("outlier_count", 0)
            if stats.get("is_constant"):
                return "Constant column — no predictive value"
            if skew is not None and abs(skew) > 1:
                direction = "right" if skew > 0 else "left"
                return f"Skewed {direction} (skew={skew:.2f}) — consider log transform"
            if outliers > 0:
                pct = round(outliers / rows * 100, 1)
                return f"{outliers} outliers detected ({pct}%) — review before modeling"
            return "Continuous variable — looks clean"

        return "OK"

    # ── Missing Severity Label ────────────────────────────────────────────────
    def _missing_severity(self, pct: float) -> str:
        if pct == 0:
            return "none"
        if pct <= 5:
            return "low"
        if pct <= 15:
            return "moderate"
        if pct <= 50:
            return "high"
        return "critical"

    # ── Dataset Health Score ──────────────────────────────────────────────────
    # A simple 0–100 score. Think of it as a report card for your dataset.
    def _health_score(self, columns_info: list) -> int:
        if not columns_info:
            return 0
        total = len(columns_info)
        penalties = 0
        for col in columns_info:
            mp = col["missing_percent"]
            if mp > 50:
                penalties += 2       # heavily missing — big penalty
            elif mp > 15:
                penalties += 1       # moderately missing
            if "All null" in col["notes"]:
                penalties += 2
        score = max(0, 100 - int((penalties / (total * 2)) * 100))
        return score

    # ── Correlations ─────────────────────────────────────────────────────────
    def _correlations(self) -> dict:
        try:
            numeric_df = self.df.select_dtypes(include="number")
            if numeric_df.empty or len(numeric_df.columns) < 2:
                return {}
            raw = numeric_df.corr().to_dict()
            return {
                str(k): {
                    str(sk): round(float(v), 4) if pd.notna(v) else 0.0
                    for sk, v in sub.items()
                }
                for k, sub in raw.items()
            }
        except Exception:
            return {}

    # ── Utility ───────────────────────────────────────────────────────────────
    @staticmethod
    def _safe_float(val) -> float | None:
        try:
            return round(float(val), 4) if pd.notna(val) else None
        except Exception:
            return None