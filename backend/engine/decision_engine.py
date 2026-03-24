import pandas as pd

class DecisionEngine:
    def __init__(self, context: dict):
        self.context = context
        self.profile = context.get("profile", "mixed")
        self.intent = context.get("intent", "exploratory")
        self.quality = context.get("quality", {})
        self.ethical = context.get("ethical", {})
        self.eda = context.get("eda", {})

    def get_recommendations(self) -> list:
        actions = []

        # 1. PII & Ethics
        if self.ethical.get("risk_level") == "High" or any("PII" in c.get("notes", "") for c in self.eda.get("columns", [])):
            actions.append({
                "id": "mask_pii",
                "label": "Secure Dataset (Mask PII)",
                "action": "Remove or mask identified PII columns (Name, Email, etc.) before further processing.",
                "priority": "High"
            })

        # 2. ML Readiness - Categorical
        if self.profile == "categorical_heavy" and self.intent == "ml":
            actions.append({
                "id": "encode_features",
                "label": "Prepare Encoding",
                "action": "Apply One-Hot or Target encoding to high-cardinality categorical features.",
                "priority": "High"
            })

        # 3. Data Cleaning - Missing Values
        if any(c.get("missing_percent", 0) > 10 for c in self.eda.get("columns", [])):
            actions.append({
                "id": "impute_data",
                "label": "Fix Missing Values",
                "action": "Implement mean/median imputation for numerical gaps and mode imputation for categories.",
                "priority": "Medium"
            })

        # 4. Profile Specific - Numerical
        if self.profile == "numerical":
            actions.append({
                "id": "scale_features",
                "label": "Scale Numerical Data",
                "action": "Apply StandardScaler or MinMaxScaler to ensure balanced coefficients during modeling.",
                "priority": "Medium"
            })

        # Fallback
        if not actions:
            actions.append({
                "id": "standard_eda",
                "label": "Deepen Exploration",
                "action": "Proceed with bivariate correlation analysis to find hidden signals.",
                "priority": "Low"
            })

        return actions
