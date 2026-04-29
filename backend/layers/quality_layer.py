import pandas as pd


class QualityLayer:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def process(self, eda_output: dict, ethical_output: dict = None) -> dict:
        issues = []
        recommendations = []
        deductions = 0.0
        columns = eda_output.get("columns", [])
        total_rows = len(self.df)
        total_cols = len(self.df.columns)

        # ── 1. Missing Values ─────────────────────────────────────────────
        # Penalty scales with severity — not a flat 20 for any missing data
        for col in columns:
            mp = col["missing_percent"]
            if mp > 50:
                deductions += 15
                issues.append(
                    f"'{col['name']}' is {mp:.1f}% missing — critical"
                )
                recommendations.append(
                    f"Consider dropping '{col['name']}' — over half its values are missing."
                )
            elif mp > 20:
                deductions += 8
                issues.append(
                    f"'{col['name']}' has {mp:.1f}% missing values"
                )
                recommendations.append(
                    f"Impute '{col['name']}': median for numeric, mode for categorical."
                )

        # ── 2. Duplicate Rows ─────────────────────────────────────────────
        # Penalty scales with duplicate rate, not just presence
        try:
            duplicates = int(self.df.astype(str).duplicated().sum())
        except Exception:
            duplicates = 0

        if duplicates > 0:
            dup_pct = duplicates / total_rows * 100 if total_rows > 0 else 0
            if dup_pct > 10:
                deductions += 20
            elif dup_pct > 2:
                deductions += 10
            else:
                deductions += 5
            issues.append(
                f"{duplicates} duplicate rows ({dup_pct:.1f}% of dataset)"
            )
            recommendations.append("Remove duplicates with df.drop_duplicates().")

        # ── 3. Class Imbalance ────────────────────────────────────────────
        imbalance_cols = []
        for col in columns:
            if col["type"] == "categorical" and col["name"] in self.df.columns:
                try:
                    counts = self.df[col["name"]].astype(str).value_counts(normalize=True)
                    if not counts.empty and counts.iloc[0] > 0.8:
                        imbalance_cols.append({
                            "column": col["name"],
                            "dominant_pct": round(float(counts.iloc[0]) * 100, 1),
                            "dominant_value": str(counts.index[0]),
                        })
                except Exception:
                    pass

        if imbalance_cols:
            deductions += min(15, len(imbalance_cols) * 5)  # cap at 15
            for ic in imbalance_cols:
                issues.append(
                    f"'{ic['column']}' is {ic['dominant_pct']}% "
                    f"'{ic['dominant_value']}' — highly imbalanced"
                )
            recommendations.append(
                "Consider SMOTE or stratified sampling before modeling on imbalanced columns."
            )

        # ── 4. Constant Columns ───────────────────────────────────────────
        # A column where every value is the same has zero information value
        constant_cols = []
        for col in self.df.columns:
            try:
                if self.df[col].astype(str).nunique() <= 1:
                    constant_cols.append(str(col))
            except Exception:
                pass

        if constant_cols:
            deductions += len(constant_cols) * 3  # 3 pts per constant col
            issues.append(
                f"{len(constant_cols)} constant column(s): {', '.join(constant_cols)}"
            )
            recommendations.append(
                "Drop constant columns — they carry no information for analysis or modeling."
            )

        # ── 5. Outlier Presence ───────────────────────────────────────────
        # Read from EDA stats — don't recompute
        outlier_cols = []
        for col in columns:
            if col["type"] == "numeric":
                outlier_count = col.get("_stats", {}).get("outlier_count", 0)
                if outlier_count and outlier_count > 0:
                    outlier_cols.append(col["name"])

        if outlier_cols:
            deductions += min(10, len(outlier_cols) * 2)
            issues.append(
                f"Outliers detected in: {', '.join(outlier_cols)}"
            )
            recommendations.append(
                "Review outliers — cap with IQR clipping or investigate as genuine anomalies."
            )

        # ── Completeness (corrected formula) ─────────────────────────────
        # Proportion of non-null cells across the entire dataset
        try:
            total_cells = total_rows * total_cols
            null_cells = int(self.df.isnull().sum().sum())
            completeness = round((1 - null_cells / total_cells) * 100, 2) if total_cells > 0 else 100.0
        except Exception:
            completeness = 100.0

        # ── Privacy risk — read from ethical layer, not EDA strings ──────
        privacy_risk = "Low"
        if ethical_output and isinstance(ethical_output, dict):
            risk_level = ethical_output.get("risk_level", "Low")
            if risk_level == "High":
                privacy_risk = "High"
                deductions += 10
            elif risk_level == "Medium":
                privacy_risk = "Medium"
                deductions += 5

        # ── Score & Grade ─────────────────────────────────────────────────
        quality_score = max(0, round(100 - deductions))

        if quality_score >= 85:
            grade = "Excellent"
        elif quality_score >= 70:
            grade = "Good"
        elif quality_score >= 50:
            grade = "Fair"
        else:
            grade = "Poor"

        return {
            "quality_score": quality_score,
            "grade": grade,
            "issues": issues,
            "recommendations": recommendations,
            "metrics": {
                "completeness": completeness,
                "duplicate_count": duplicates,
                "duplicate_pct": round(duplicates / total_rows * 100, 2) if total_rows > 0 else 0,
                "constant_columns": constant_cols,
                "imbalanced_columns": imbalance_cols,
                "outlier_columns": outlier_cols,
                "privacy_risk": privacy_risk,
                "is_balanced": len(imbalance_cols) == 0,
            }
        }