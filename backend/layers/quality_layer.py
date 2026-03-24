import pandas as pd

class QualityLayer:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def process(self, eda_output: dict) -> dict:
        issues = []
        recommendations = []
        deductions = 0
        
        # 1. Missing Values
        high_missing_detected = False
        for col in eda_output.get("columns", []):
            if col["missing_percent"] > 20:
                high_missing_detected = True
                issues.append(f"Column '{col['name']}' has high missing values ({col['missing_percent']:.1f}%)")
                recommendations.append(f"For '{col['name']}', consider imputation (mean/median for numeric, mode for categorical).")
                if col["missing_percent"] > 40:
                    recommendations.append(f"Consider dropping '{col['name']}' due to critical missingness (>40%).")
        
        if high_missing_detected: deductions += 20
            
        # 2. Duplicate Rows
        try:
            # Handle unhashable types for duplication check
            duplicates = int(self.df.astype(str).duplicated().sum())
        except Exception:
            duplicates = 0
            
        if duplicates > 0:
            deductions += 20
            issues.append(f"Dataset contains {duplicates} duplicate rows")
            recommendations.append("Remove duplicate rows to ensure data uniqueness.")
            
        # 3. Imbalance Detection
        imbalance_detected = False
        for col in eda_output.get("columns", []):
            if col["type"] == "categorical":
                col_name = col["name"]
                if col_name in self.df.columns and not self.df[col_name].empty:
                    try:
                        # Stringify for value_counts if it contains unhashable types
                        counts = self.df[col_name].astype(str).value_counts(normalize=True)
                        if not counts.empty and counts.iloc[0] > 0.8:
                            imbalance_detected = True
                            issues.append(f"Column '{col_name}' is highly imbalanced ({counts.iloc[0]*100:.1f}% single category)")
                            recommendations.append(f"Review distribution for '{col_name}'; consider resampling if used for modeling.")
                    except Exception:
                        pass
        
        if imbalance_detected: deductions += 20
            
        quality_score = max(0, 100 - deductions)
        grade = "Excellent" if quality_score >= 80 else ("Good" if quality_score >= 60 else "Poor")
            
        return {
            "quality_score": quality_score,
            "grade": grade,
            "issues": issues,
            "recommendations": recommendations,
            "metrics": {
                "completeness": 100 - (sum(c["missing_percent"] for c in eda_output.get("columns", [])) / len(eda_output.get("columns", []))) if eda_output.get("columns") else 100,
                "duplicates": (duplicates / len(self.df) * 100) if len(self.df) > 0 else 0,
                "is_balanced": not imbalance_detected,
                "privacy_risk": "High" if any("PII" in c["notes"] for c in eda_output.get("columns", [])) else "Low"
            }
        }
