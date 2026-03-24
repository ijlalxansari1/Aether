# backend/models/analysis.py
import json
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from db import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id                  = Column(String(36),  primary_key=True)
    filename            = Column(String(255), nullable=False, default="unknown")
    intent              = Column(String(50),  nullable=False, default="exploratory")
    profile             = Column(String(50))
    row_count           = Column(Integer)
    col_count           = Column(Integer)

    # IQ Score
    iq_score            = Column(Float)

    # Ethical layer
    ethical_risk_level  = Column(String(20))
    ethical_type        = Column(String(50))
    ethical_message     = Column(Text)
    ethical_columns     = Column(JSON)
    recommendations     = Column(JSON)

    created_at          = Column(DateTime, default=datetime.utcnow)

    # Relationship to columns
    columns             = relationship("AnalysisColumn", back_populates="analysis",
                                       cascade="all, delete-orphan")


class AnalysisColumn(Base):
    __tablename__ = "analysis_columns"

    id                  = Column(Integer, primary_key=True, autoincrement=True)
    analysis_id         = Column(String(36), ForeignKey("analyses.id", ondelete="CASCADE"))
    name                = Column(String(255))
    type                = Column(String(50))
    missing_percent     = Column(Float)
    notes               = Column(String(100))
    stats               = Column(JSON)

    analysis            = relationship("Analysis", back_populates="columns")