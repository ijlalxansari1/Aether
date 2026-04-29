import re
import pandas as pd


# ── Constants ─────────────────────────────────────────────────────────────────

SENSITIVE_KEYWORD_MAP = {
    "gender": "demographic",   "sex": "demographic",      "age": "demographic",
    "dob": "demographic",      "religion": "demographic", "ethnicity": "demographic",
    "race": "demographic",     "nationality": "demographic", "marital": "demographic",
    "disability": "demographic", "veteran": "demographic",
    "location": "geographic",  "city": "geographic",      "country": "geographic",
    "zipcode": "geographic",   "zip": "geographic",       "latitude": "geographic",
    "longitude": "geographic", "region": "geographic",    "state": "geographic",
    "postcode": "geographic",
    "salary": "financial",     "income": "financial",     "wage": "financial",
    "credit": "financial",     "loan": "financial",       "debt": "financial",
}

PII_KEYWORDS = [
    "name", "first_name", "last_name", "email", "phone",
    "contact", "address", "ssn", "passport", "dob", "birthdate",
]

# Regex patterns for value-level PII scanning (checks actual cell contents)
PII_VALUE_PATTERNS = {
    "email":   re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}'),
    "phone":   re.compile(r'(\+?\d[\d\s\-().]{7,}\d)'),
    "ssn":     re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
}

RISK_WEIGHTS = {"demographic": 3, "financial": 2, "geographic": 1, "privacy": 2}
IMBALANCE_THRESHOLD = 0.80  # Named constant — easier to adjust and explain


class EthicalLayer:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def process(self) -> dict:
        if self.df.empty:
            return self._clean_result()

        findings = []       # One entry per detected issue
        pii_columns = []    # Columns with PII by name
        value_pii = []      # Columns with PII detected in values

        for col in self.df.columns:
            col_str = str(col)
            col_lower = col_str.lower()
            series = self.df[col]

            # ── 1. Name-based PII detection ───────────────────────────────
            for k in PII_KEYWORDS:
                if self._word_match(col_lower, k):
                    pii_columns.append(col_str)
                    break

            # ── 2. Name-based sensitive attribute detection ───────────────
            for keyword, category in SENSITIVE_KEYWORD_MAP.items():
                if self._word_match(col_lower, keyword):
                    imbalance_info = self._check_imbalance(series)
                    findings.append({
                        "column": col_str,
                        "category": category,
                        "match_reason": f"column name contains '{keyword}'",
                        "imbalance": imbalance_info,
                    })
                    break

            # ── 3. Value-level PII scanning ───────────────────────────────
            # Checks actual cell contents for email/phone/SSN patterns
            # Only run on string columns not already flagged by name
            if col_str not in pii_columns and self._is_string_column(series):
                detected = self._scan_values_for_pii(series)
                if detected:
                    value_pii.append({
                        "column": col_str,
                        "detected_types": detected,
                        "match_reason": "value pattern match",
                    })

        # ── No issues found ───────────────────────────────────────────────
        if not findings and not pii_columns and not value_pii:
            return self._clean_result()

        # ── Build risk profile ────────────────────────────────────────────
        categories_found = list({f["category"] for f in findings})
        has_pii = bool(pii_columns or value_pii)
        has_imbalance = any(f["imbalance"]["detected"] for f in findings)

        risk_level, risk_score = self._calculate_risk(
            categories_found, has_pii, has_imbalance
        )

        recommendations = self._build_recommendations(
            categories_found, has_pii, has_imbalance, value_pii
        )

        # Evidence trail — what exactly triggered each finding
        evidence = self._build_evidence(findings, pii_columns, value_pii)

        return {
            "type": categories_found[0] if categories_found else "privacy",
            "categories": categories_found,          # NEW — all risk categories
            "columns": [f["column"] for f in findings],
            "pii_columns": pii_columns,
            "value_pii_columns": [v["column"] for v in value_pii],  # NEW
            "risk_level": risk_level,
            "risk_score": risk_score,                # NEW — 0-100 numeric score
            "has_imbalance": has_imbalance,
            "message": self._build_message(categories_found, has_pii, has_imbalance),
            "recommendations": recommendations,
            "evidence": evidence,                    # NEW — why each flag was raised
        }

    # ── Whole-word keyword match ──────────────────────────────────────────────
    def _word_match(self, text: str, keyword: str) -> bool:
        return bool(re.search(rf'\b{re.escape(keyword)}\b', text))

    # ── Imbalance detection with evidence ────────────────────────────────────
    def _check_imbalance(self, series: pd.Series) -> dict:
        """
        Checks if one value dominates the column.
        Returns evidence (which value, what %) not just True/False.
        """
        try:
            if pd.api.types.is_numeric_dtype(series):
                return {"detected": False}
            counts = series.value_counts(normalize=True)
            if counts.empty:
                return {"detected": False}
            top_val = counts.index[0]
            top_freq = float(counts.iloc[0])
            if top_freq > IMBALANCE_THRESHOLD:
                return {
                    "detected": True,
                    "dominant_value": str(top_val),
                    "dominant_pct": round(top_freq * 100, 1),
                }
            return {"detected": False}
        except Exception:
            return {"detected": False}

    # ── Value-level PII scanning ──────────────────────────────────────────────
    def _scan_values_for_pii(self, series: pd.Series) -> list[str]:
        """
        Samples up to 200 rows and scans values for email/phone/SSN patterns.
        Returns list of detected PII types.
        """
        detected = []
        sample = series.dropna().astype(str).head(200)
        if sample.empty:
            return detected
        combined = " ".join(sample.tolist())
        for pii_type, pattern in PII_VALUE_PATTERNS.items():
            if pattern.search(combined):
                detected.append(pii_type)
        return detected

    # ── Risk scoring ──────────────────────────────────────────────────────────
    def _calculate_risk(self, categories: list, has_pii: bool, has_imbalance: bool):
        """
        Scores risk 0–100. Transparent and adjustable.
        """
        score = 0
        for cat in categories:
            score += RISK_WEIGHTS.get(cat, 1) * 20
        if has_pii:
            score += 25
        if has_imbalance:
            score += 15
        score = min(score, 100)

        if score >= 70:
            level = "High"
        elif score >= 35:
            level = "Medium"
        else:
            level = "Low"

        return level, score

    # ── Evidence trail ────────────────────────────────────────────────────────
    def _build_evidence(self, findings, pii_columns, value_pii) -> list:
        evidence = []
        for f in findings:
            entry = {
                "column": f["column"],
                "category": f["category"],
                "reason": f["match_reason"],
            }
            if f["imbalance"]["detected"]:
                entry["imbalance"] = (
                    f"{f['imbalance']['dominant_value']} appears in "
                    f"{f['imbalance']['dominant_pct']}% of rows"
                )
            evidence.append(entry)
        for col in pii_columns:
            evidence.append({"column": col, "category": "privacy", "reason": "PII keyword in column name"})
        for v in value_pii:
            evidence.append({
                "column": v["column"],
                "category": "privacy",
                "reason": f"PII pattern found in values: {', '.join(v['detected_types'])}",
            })
        return evidence

    # ── Recommendations ───────────────────────────────────────────────────────
    def _build_recommendations(self, categories, has_pii, has_imbalance, value_pii) -> list:
        recs = []
        if has_pii:
            recs.append("Anonymize or hash all PII fields before sharing or modeling")
        if value_pii:
            recs.append("PII detected in cell values — consider redacting or masking column contents")
        if has_imbalance:
            recs.append("Apply resampling (SMOTE or undersampling) to balance skewed class distributions")
        if "demographic" in categories:
            recs.append("Conduct fairness audit (e.g. Fairlearn or Aequitas) before predictive modeling")
        if "geographic" in categories:
            recs.append("Apply data minimization — collect only the location granularity your use case requires")
        if "financial" in categories:
            recs.append("Ensure financial attributes comply with relevant regulations (GDPR, CCPA, FCRA)")
        if not recs:
            recs.append("No immediate action required — continue standard data quality monitoring")
        return recs

    # ── Message builder ───────────────────────────────────────────────────────
    def _build_message(self, categories, has_pii, has_imbalance) -> str:
        parts = []
        if categories:
            parts.append(f"{', '.join(c.capitalize() for c in categories)} attributes detected")
        if has_pii:
            parts.append("PII present")
        if has_imbalance:
            parts.append("class imbalance detected in sensitive columns")
        if not parts:
            return "No ethical risks detected."
        return f"{' | '.join(parts)} — review before use."

    # ── Helpers ───────────────────────────────────────────────────────────────
    def _is_string_column(self, series: pd.Series) -> bool:
        return not pd.api.types.is_numeric_dtype(series) and not pd.api.types.is_datetime64_any_dtype(series)

    def _clean_result(self) -> dict:
        return {
            "type": "none",
            "categories": [],
            "columns": [],
            "pii_columns": [],
            "value_pii_columns": [],
            "risk_level": "Low",
            "risk_score": 0,
            "has_imbalance": False,
            "message": "Dataset appears clean. No sensitive attributes detected.",
            "recommendations": ["Continue with standard data quality checks."],
            "evidence": [],
        }