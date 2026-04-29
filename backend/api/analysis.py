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

# Maps frontend intent strings → EDALayer mode strings
# Add new intents here as AETHER grows — one place, no hunting
INTENT_TO_MODE = {
    "exploratory": "exploratory",
    "ml":          "ml",
    "business":    "business",
    "cleaning":    "cleaning",
}


@router.post("/analyze/{dataset_id}")
@limiter.limit("10/minute")
async def analyze_dataset(
    request: Request,
    dataset_id: str,
    analysis_request: AnalysisRequest,
    db: Session = Depends(get_db),
):
    # ── 1. Retrieve dataset ───────────────────────────────────────
    df = get_dataset(dataset_id)
    if df is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found or expired. Please re-upload."
        )

    # ── 2. Resolve mode ───────────────────────────────────────────
    # Normalize intent from frontend → internal mode string
    # Unknown intents fall back to "exploratory" safely
    mode = INTENT_TO_MODE.get(
        str(analysis_request.intent).lower(),
        "exploratory"
    )

    # ── 3. Run pipeline ───────────────────────────────────────────
    try:
        engine = AetherEngine(df, intent=analysis_request.intent, mode=mode)
        results = engine.run()
    except Exception as e:
        logger.error(
            f"Pipeline failed | dataset_id={dataset_id} | error={e}",
            exc_info=True   # logs full traceback — but NOT sent to client
        )
        raise HTTPException(
            status_code=500,
            detail="Analysis failed. Please try again."  # generic — no internals exposed
        )

    # ── 4. Persist to DB ──────────────────────────────────────────
    try:
        save_analysis(db, results, filename=dataset_id)
    except Exception as e:
        logger.error(
            f"Persist failed silently | session_id={results.get('session_id')} | error={e}"
        )

    # ── 5. Log and return ─────────────────────────────────────────
    logger.info(
        f"Analysis complete | session_id={results.get('session_id')} "
        f"| mode={mode} "
        f"| iq_score={results.get('iq_score')} "
        f"| risk={results.get('ethical', {}).get('risk_level', 'unknown')}"
    )

    return results