import pandas as pd


class PreprocessingLayer:
    HIGH_CARDINALITY_THRESHOLD = 20

    def __init__(self, df: pd.DataFrame):
        self.df = df

    def process(self, eda_output: dict) -> dict:
        encoding_required = []
        scaling_required = []
        transformations = []

        for col_info in eda_output.get("columns", []):
            col = col_info["name"]
            col_type = col_info["type"]
            unique_count = col_info.get("unique_count", 0)

            if col not in self.df.columns:
                continue

            # 1. Encoding needs (categorical columns)
            if col_type == "categorical":
                if unique_count <= 10:
                    encoding_required.append({
                        "column": col,
                        "strategy": "One-Hot Encoding",
                        "reason": f"Low cardinality ({unique_count} unique values) — OHE is appropriate."
                    })
                elif unique_count <= self.HIGH_CARDINALITY_THRESHOLD:
                    encoding_required.append({
                        "column": col,
                        "strategy": "Label / Ordinal Encoding",
                        "reason": f"Medium cardinality ({unique_count} unique values) — consider ordinal or target encoding."
                    })
                else:
                    encoding_required.append({
                        "column": col,
                        "strategy": "Target / Frequency Encoding",
                        "reason": f"High cardinality ({unique_count} unique values) — OHE would cause dimensionality explosion."
                    })

            # 2. Scaling needs (numeric columns)
            elif col_type == "numeric":
                try:
                    series = pd.to_numeric(self.df[col], errors="coerce").dropna()
                    if len(series) < 2:
                        continue
                    data_range = float(series.max() - series.min())
                    if data_range > 1000 or series.max() > 100:
                        scaling_required.append({
                            "column": col,
                            "strategy": "StandardScaler or MinMaxScaler",
                            "reason": f"Wide range ({data_range:.0f}) — scaling prevents feature dominance."
                        })
                except Exception:
                    continue

            # 3. Datetime transformations
            elif col_type == "datetime":
                transformations.append({
                    "column": col,
                    "strategy": "Datetime Decomposition",
                    "reason": "Extract year, month, day, weekday features for richer temporal signals."
                })

        return {
            "encoding_required": encoding_required,
            "scaling_required": scaling_required,
            "transformations": transformations
        }
