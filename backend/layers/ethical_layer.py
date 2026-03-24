import re
import pandas as pd


class EthicalLayer:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def _matches_keyword(self, col_lower: str, keyword: str) -> bool:
        """Whole-word match to avoid false positives (e.g. 'manage' matching 'age')."""
        return bool(re.search(rf'\b{keyword}\b', col_lower))

    def process(self) -> dict:
        if self.df.empty:
            return {
                "type": "none",
                "columns": [],
                "risk_level": "Low",
                "message": "Dataset appears clean. No sensitive attributes detected.",
                "recommendations": ["Continue with standard data quality checks."]
            }

        keyword_map = {
            "gender": "demographic", "sex": "demographic", "age": "demographic",
            "dob": "demographic", "religion": "demographic", "ethnicity": "demographic",
            "race": "demographic", "nationality": "demographic",
            "location": "geographic", "city": "geographic", "country": "geographic",
            "zipcode": "geographic", "latitude": "geographic", "longitude": "geographic"
        }
        pii_keywords = [
            "name", "first_name", "last_name", "email",
            "phone", "contact", "address", "ssn", "passport"
        ]

        detected_columns = []
        primary_category = "none"
        has_imbalance = False
        has_pii = False

        for col in self.df.columns:
            col_lower = str(col).lower()

            # PII check — whole word match
            for k in pii_keywords:
                if self._matches_keyword(col_lower, k):
                    has_pii = True
                    break

            # Sensitive attribute check — whole word match
            for keyword, category in keyword_map.items():
                if self._matches_keyword(col_lower, keyword):
                    if str(col) not in detected_columns:
                        detected_columns.append(str(col))
                    if primary_category == "none":
                        primary_category = category

                    try:
                        if not pd.api.types.is_numeric_dtype(self.df[col]):
                            if self.df[col].nunique() > 0:
                                top_freq = self.df[col].value_counts(normalize=True).max()
                                if top_freq > 0.8:
                                    has_imbalance = True
                    except Exception:
                        pass
                    break

        # Build recommendations
        recommendations = []
        if has_pii:
            recommendations.append("Anonymize or hash all PII fields before processing")
        if has_imbalance:
            recommendations.append("Apply resampling to balance skewed class distribution")
        if primary_category == "demographic":
            recommendations.append("Conduct fairness audit before any predictive modeling")
        if primary_category == "geographic":
            recommendations.append("Collect minimum location data necessary for the use case")
        if not recommendations:
            recommendations.append("No immediate action required — continue monitoring")

        # No sensitive data found
        if not detected_columns and not has_pii:
            return {
                "type": "none",
                "columns": [],
                "risk_level": "Low",
                "message": "Dataset appears clean. No sensitive attributes detected.",
                "recommendations": recommendations
            }

        # PII only, no demographic/geographic columns
        if not detected_columns and has_pii:
            return {
                "type": "privacy",
                "columns": ["PII Fields"],
                "risk_level": "Medium",
                "message": "PII detected — compliance with data protection standards required.",
                "recommendations": recommendations
            }

        # Determine risk level and message
        implication = "may introduce risk depending on usage context"
        if primary_category == "demographic":
            implication = "may introduce demographic bias or fairness concerns"
        elif primary_category == "geographic":
            implication = "may introduce location-based risk depending on application scope"

        if has_pii and primary_category != "none":
            risk_level = "High"
            message = (
                f"Dataset contains both {primary_category} attributes and PII, "
                f"significantly increasing ethical risk."
            )
        elif has_imbalance:
            risk_level = "High"
            message = (
                f"{primary_category.capitalize()} attributes show severe class imbalance, "
                f"elevating risk of biased outcomes."
            )
        else:
            risk_level = "Medium"
            message = f"{primary_category.capitalize()} attributes detected which {implication}."

        return {
            "type": primary_category if primary_category != "none" else "privacy",
            "columns": detected_columns,
            "risk_level": risk_level,
            "message": message,
            "recommendations": recommendations
        }