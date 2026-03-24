import pandas as pd

class FeatureLayer:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def process(self, eda_output: dict) -> dict:
        important = []
        low_value = []
        risky = []
        
        for col in eda_output.get("columns", []):
            name = col["name"]
            col_type = col["type"]
            missing = col["missing_percent"]
            notes = col["notes"]
            
            # 1. Risky Features (PII or High Missingness)
            if "PII" in notes or missing > 20:
                risky.append({
                    "name": name, 
                    "reason": "Privacy risk" if "PII" in notes else f"High missingness ({missing:.1f}%)"
                })
                continue
                
            # 2. Low-Value Features (Constant or nearly constant)
            if col_type == "categorical":
                try:
                    # Handle unhashable types by stringifying
                    unique_count = self.df[name].astype(str).nunique() if name in self.df.columns else 0
                except Exception:
                    unique_count = 0
                    
                if unique_count <= 1:
                    low_value.append({"name": name, "reason": "Constant value"})
                    continue
            
            # 3. Important Features (Heuristic: High variance or meaningful categorical)
            if col_type == "numeric":
                important.append({"name": name, "reason": "High information density"})
            elif col_type == "categorical" and notes == "OK":
                important.append({"name": name, "reason": "Strong categorical anchor"})
                
        return {
            "important_features": important[:5],
            "low_value_features": low_value,
            "risky_features": risky
        }
