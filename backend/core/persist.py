import logging
from sqlalchemy.orm import Session
from models.analysis import Analysis, AnalysisColumn
from datetime import datetime

logger = logging.getLogger("aether.persist")

def save_analysis(db: Session, results: dict, filename: str):
    """
    Persist analysis results to the database.
    """
    try:
        session_id = results.get("session_id")
        intent = results.get("intent", "exploratory")
        profile = results.get("profile", "basic")
        
        # Get EDA data
        eda = results.get("eda", {})
        summary = eda.get("summary", {})
        row_count = summary.get("rows", 0)
        col_count = summary.get("columns", 0)
        
        iq_score = results.get("iq_score", 0.0)
        
        # Get Ethical data
        ethical = results.get("ethical", {})
        ethical_risk_level = ethical.get("risk_level", "unknown")
        ethical_type = ethical.get("flag_type")
        ethical_message = ethical.get("message")
        ethical_columns = ethical.get("flagged_columns", [])
        
        # Get Recommendations/Insights
        insights_layer = results.get("insights", {})
        recommendations = insights_layer.get("insights", [])
        if not recommendations:
            recommendations = results.get("recommendations", [])
            
        # Create Analysis record
        db_analysis = Analysis(
            id=session_id,
            filename=filename,
            intent=intent,
            profile=profile,
            row_count=row_count,
            col_count=col_count,
            iq_score=iq_score,
            ethical_risk_level=ethical_risk_level,
            ethical_type=ethical_type,
            ethical_message=ethical_message,
            ethical_columns=ethical_columns,
            recommendations=recommendations,
            created_at=datetime.utcnow()
        )
        
        # Create column records
        columns_data = eda.get("columns", [])
        for col in columns_data:
            col_name = col.get("name", "unknown")
            col_type = col.get("type", "unknown")
            missing_percent = col.get("missing_percent", 0.0)
            notes = col.get("notes")
            
            # stats is everything else
            stats = {k: v for k, v in col.items() if k not in ["name", "type", "missing_percent", "notes"]}
            
            db_column = AnalysisColumn(
                analysis_id=session_id,
                name=col_name,
                type=col_type,
                missing_percent=missing_percent,
                notes=notes,
                stats=stats
            )
            db_analysis.columns.append(db_column)
            
        db.add(db_analysis)
        db.commit()
        logger.info(f"Persisted analysis for session {session_id}")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to persist analysis: {e}")
        raise
