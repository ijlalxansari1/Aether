# backend/create_tables.py
from db import engine, Base
from models.analysis import Analysis, AnalysisColumn  # imports register the models

Base.metadata.create_all(bind=engine)
print("✅ Tables created: analyses, analysis_columns")