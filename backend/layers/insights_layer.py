import pandas as pd
import numpy as np

class InsightsLayer:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def process(self, eda_output: dict, intent: str = "exploratory", profile: str = "mixed") -> dict:
        insights = []
        if self.df.empty:
            return {
                "summary": "Dataset appears to be completely empty.",
                "insights": ["Dataset contains no structural content.", "Completeness evaluates to zero.", "Dataset columns are void."]
            }
        
        total_cols = len(eda_output.get("columns", []))
        has_any_missing = False
        has_pii = False
        has_identifier = False
        
        # Tracking for Intent Logic
        for col_info in eda_output.get("columns", []):
            if col_info["missing_percent"] > 0: has_any_missing = True
            if "PII" in col_info["notes"]: has_pii = True
            if "Identifier" in col_info["notes"]: has_identifier = True

        # 1. Profile-Intent Intersection Logic
        if profile == "categorical_heavy":
            if intent == "ml":
                insights.append("High categorical density detected \u2192 prioritize feature transformation and encoding strategies.")
                insights.append("Complexity of categorical features introduces high risk of overfitting in standard models.")
            else:
                insights.append("Dataset is entity-heavy \u2192 utilize frequency analysis and distribution mapping for categorical nodes.")
        
        if profile == "numerical":
            if intent == "exploratory":
                insights.append("Strictly numerical structure \u2192 enables deep statistical profiling \u2192 use non-linear correlation scans to find hidden dependencies.")
            else:
                insights.append("Numerical dominance \u2192 supports distance-based modeling \u2192 ensure feature scaling (StandardScaler) is applied.")

        # 2. General Adaptive Insights (Intent-driven)
        if intent == "ml":
            insights.append("Focus is on feature readiness and signal density \u2192 impacts model training \u2192 prioritize high-variance attributes.")
        elif intent == "cleaning":
            insights.append("Focus is on structural integrity and data health \u2192 impacts data downstream \u2192 address missingness and duplicates immediately.")
        elif intent == "business":
            insights.append("Focus is on high-level patterns and decision support \u2192 impacts ROI analysis \u2192 prioritize summary statistics and trends.")

        # 3. Structural & Quality Insights (Fallback/Global)
        if has_any_missing:
            insights.append("Trace missingness detected \u2192 may reduce statistical power \u2192 apply localized imputation for the specific mission.")
        else:
            insights.append("Global data completeness is high \u2192 enables maximum reliability \u2192 proceed with direct intelligence mapping.")
            
        if has_pii: insights.append("Sensitive PII markers detected \u2192 introduces privacy risks \u2192 ensure compliance or apply masking protocols.")
            
        # Fallbacks & Formatting
        unique_insights = list(dict.fromkeys(insights))[:5]
        while len(unique_insights) < 3:
            unique_insights.append(f"Analyzing {total_cols} nodes for {intent} patterns.")
            
        type_str = f"{profile} dataset" if profile != "mixed" else "general analytical dataset"
        summary = f"Aether has scanned {total_cols} nodes. This appears to be a {type_str} with {('variable' if has_any_missing else 'high')} data completeness."
        
        return {"summary": summary, "insights": unique_insights}
