import pandas as pd
import numpy as np


class CleaningLayer:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def process(self, eda_output: dict) -> dict:
        issues = []
        suggestions = []

        for col_info in eda_output.get("columns", []):
            col = col_info["name"]
            col_type = col_info["type"]
            missing_pct = col_info["missing_percent"]

            if col not in self.df.columns:
                continue

            # 1. Missing Values
            if missing_pct > 0:
                if col_type == "numeric":
                    issues.append(f"'{col}' has {missing_pct:.1f}% missing numeric values.")
                    suggestions.append(f"Impute '{col}' with mean (symmetric) or median (skewed distribution).")
                elif col_type == "categorical":
                    issues.append(f"'{col}' has {missing_pct:.1f}% missing categorical values.")
                    suggestions.append(f"Impute '{col}' with mode or a sentinel value like 'Unknown'.")
                elif col_type == "datetime":
                    issues.append(f"'{col}' has {missing_pct:.1f}% missing datetime values.")
                    suggestions.append(f"Forward-fill or interpolate '{col}' for time-series continuity.")

        # 2. Duplicate Rows
        try:
            dup_count = int(self.df.astype(str).duplicated().sum())
            if dup_count > 0:
                issues.append(f"{dup_count} duplicate row(s) detected.")
                suggestions.append("Drop duplicate rows using `df.drop_duplicates()` before modeling.")
        except Exception:
            pass

        # 3. Outliers via IQR (numeric columns only)
        for col_info in eda_output.get("columns", []):
            col = col_info["name"]
            if col_info["type"] != "numeric" or col not in self.df.columns:
                continue
            try:
                series = pd.to_numeric(self.df[col], errors="coerce").dropna()
                if len(series) < 4:
                    continue
                q1, q3 = series.quantile(0.25), series.quantile(0.75)
                iqr = q3 - q1
                if iqr == 0:
                    continue
                outliers = ((series < q1 - 1.5 * iqr) | (series > q3 + 1.5 * iqr)).sum()
                if outliers > 0:
                    pct = (outliers / len(series)) * 100
                    issues.append(f"'{col}' contains {outliers} outlier(s) ({pct:.1f}% of values).")
                    suggestions.append(f"Cap '{col}' outliers using IQR fencing or log-transform for modeling.")
            except Exception:
                continue

        return {"issues": issues, "suggestions": suggestions}
