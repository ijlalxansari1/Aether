import pandas as pd

class EDALayer:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def process(self) -> dict:
        rows, cols = self.df.shape
        summary = {"rows": rows, "columns": cols}
        
        if self.df.empty or cols == 0:
            return {"summary": summary, "columns": [], "_correlations": {}}
            
        columns_info = []
        for col in self.df.columns:
            col_str = str(col)
            col_lower = col_str.lower()
            
            # Type Detection
            try:
                if pd.api.types.is_numeric_dtype(self.df[col]):
                    col_type = "numeric"
                elif pd.api.types.is_datetime64_any_dtype(self.df[col]):
                    col_type = "datetime"
                else:
                    parsed = pd.to_datetime(self.df[col].dropna(), errors='coerce', box=False)
                    if not parsed.empty and (len(parsed) / len(self.df[col].dropna())) >= 0.8:
                        col_type = "datetime"
                    else:
                        col_type = "categorical"
            except Exception:
                col_type = "categorical"
                
            missing_count = int(self.df[col].isnull().sum())
            missing_percent = float(missing_count / rows * 100) if rows > 0 else 0.0
            has_vals = missing_count < rows

            stats = {}
            if col_type == "numeric" and has_vals:
                stats = {
                    "mean": float(self.df[col].mean()) if pd.notna(self.df[col].mean()) else None,
                    "min": float(self.df[col].min()) if pd.notna(self.df[col].min()) else None,
                    "max": float(self.df[col].max()) if pd.notna(self.df[col].max()) else None,
                }
            elif col_type == "categorical" and has_vals:
                try:
                    # Handle unhashable types (lists/dicts in JSON) by stringifying before counting
                    stats = {"unique": int(self.df[col].astype(str).nunique())}
                except Exception:
                    stats = {"unique": 0}
                
            # PII / Identifier Logic
            identifier_keywords = ["id", "customer_id", "user_id"]
            pii_keywords = ["name", "first_name", "last_name", "email", "phone", "contact", "address"]
            
            notes = "OK"
            if not has_vals:
                notes = "All null values"
            elif missing_percent > 15:
                notes = "High missing values"
            else:
                is_identified = False
                for k in pii_keywords:
                    if k in col_lower:
                        notes = "PII Detected"
                        is_identified = True
                        break
                
                if not is_identified:
                    for k in identifier_keywords:
                        if k in col_lower.split("_") or col_lower == k or k in col_lower:
                            notes = "Potential Identifier"
                            is_identified = True
                            break
                            
                if not is_identified:
                    if col_type == "categorical" and stats.get("unique", 0) < 10:
                        notes = "Low cardinality"
                    elif col_type == "numeric":
                        notes = "Continuous variable"
            
            columns_info.append({
                "name": col_str,
                "type": col_type,
                "missing_percent": missing_percent,
                "notes": notes,
                "_stats": stats
            })
            
        correlations = {}
        try:
            numeric_df = self.df.select_dtypes(include='number')
            if not numeric_df.empty and len(numeric_df.columns) > 1:
                raw_corr = numeric_df.corr().to_dict()
                # Sanitize Numpy types for JSON
                correlations = {
                    str(k): {str(sub_k): float(v) if pd.notna(v) else 0.0 for sub_k, v in sub_dict.items()}
                    for k, sub_dict in raw_corr.items()
                }
        except Exception:
            pass

        return {
            "summary": summary,
            "columns": columns_info,
            "_correlations": correlations
        }
