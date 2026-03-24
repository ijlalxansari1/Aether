from pydantic import BaseModel
from typing import Any, Dict, List, Optional


# ── Upload ────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    dataset_id: str
    rows: int
    columns: int
    note: Optional[str] = "Ingestion complete"


# ── EDA ───────────────────────────────────────────────────────────

class EDAColumnSchema(BaseModel):
    name: str
    type: str
    missing_percent: float
    notes: str
    _stats: Optional[Dict[str, Any]] = None   # mean/min/max or unique count

    class Config:
        populate_by_name = True


class EDASummarySchema(BaseModel):
    rows: int
    columns: int


class EDASchema(BaseModel):
    summary: EDASummarySchema
    columns: List[EDAColumnSchema]
    note: Optional[str] = None                # profile-aware engine note
    _correlations: Optional[Dict[str, Any]] = None

    class Config:
        populate_by_name = True


# ── Ethical ───────────────────────────────────────────────────────

class EthicalSchema(BaseModel):
    type: str
    columns: List[str]
    risk_level: str
    message: str
    recommendations: Optional[List[str]] = []  # ← was missing, caused silent drop


# ── Insights ──────────────────────────────────────────────────────

class InsightsSchema(BaseModel):
    summary: str
    insights: List[str]


# ── Quality ───────────────────────────────────────────────────────

class QualityMetricsSchema(BaseModel):
    completeness: float
    duplicates: float
    is_balanced: bool
    privacy_risk: str


class QualitySchema(BaseModel):
    quality_score: int
    grade: str
    issues: List[str]
    recommendations: List[str]
    metrics: Optional[QualityMetricsSchema] = None


# ── Features ──────────────────────────────────────────────────────

class FeatureSchema(BaseModel):
    important_features: List[Dict[str, Any]]
    low_value_features: List[Dict[str, Any]]
    risky_features: List[Dict[str, Any]]


# ── Story ─────────────────────────────────────────────────────────

class StorySchema(BaseModel):
    title: str
    chapters: List[str]
    system_verdict: str


# ── Analysis request / response ───────────────────────────────────

class AnalysisRequest(BaseModel):
    intent: Optional[str] = "exploratory"


class AnalysisResponse(BaseModel):
    session_id: Optional[str] = None          # ← engine UUID, was missing
    iq_score: Optional[float] = None          # ← IQ score, was missing
    intent: Optional[str] = "exploratory"
    profile: Optional[str] = "mixed"
    eda: EDASchema
    ethical: EthicalSchema
    insights: InsightsSchema
    quality: QualitySchema
    features: Optional[FeatureSchema] = None
    story: Optional[StorySchema] = None