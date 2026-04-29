# backend/api/analysis.py
import logging
from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy.orm import Session

from core.store import get_dataset
from core.persist import save_analysis
from core.limiter import limiter
from db import get_db
from engine.aether_engine import AetherEngine
from models.schemas import AnalysisResponse, AnalysisRequest

router = APIRouter()
logger = logging.getLogger("aether.analysis")


@router.post("/analyze/{dataset_id}")
@limiter.limit("10/minute")
async def analyze_dataset(
    request: Request,
    dataset_id: str,
    analysis_request: AnalysisRequest,
    db: Session = Depends(get_db),          # ← DB session injected
):
    # ── 1. Retrieve dataset ───────────────────────────────────────
    df = get_dataset(dataset_id)
    if df is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found or expired. Please re-upload."
        )

    # ── 2. Run pipeline ───────────────────────────────────────────
    try:
        engine = AetherEngine(df, intent=analysis_request.intent)
        results = engine.run()
    except Exception as e:
        logger.error(f"Pipeline failed | dataset_id={dataset_id} | error={e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
        
    import traceback
    try:
        pass
    except Exception as e:
        pass
        
    logger.info("Pipeline succeeded, validating response schema")

    # ── 3. Persist to MySQL ───────────────────────────────────────
    try:
        save_analysis(db, results, filename=dataset_id)
    except Exception as e:
        # Persistence failure must NOT break the API response
        # User still gets their results — we log and move on
        logger.error(f"Persist failed silently | session_id={results.get('session_id')} | error={e}")

    # ── 4. Log and return ─────────────────────────────────────────
    logger.info(
        f"Analysis complete | session_id={results.get('session_id')} "
        f"| iq_score={results.get('iq_score')} "
        f"| risk={results.get('ethical', {}).get('risk_level', 'unknown')}"
    )

    return results