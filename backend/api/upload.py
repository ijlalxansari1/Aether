import uuid
import io
import json
import logging

import magic
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, Request

from core.store import store_dataset
from core.config import settings
from models.schemas import UploadResponse
from core.limiter import limiter

router = APIRouter()
logger = logging.getLogger("aether.upload")


@router.post("/upload", response_model=UploadResponse)
@limiter.limit("10/minute")
async def upload_file(request: Request, file: UploadFile = File(...)):

    # ── 1. Read & size check ──────────────────────────────────────
    content = await file.read()

    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max size is {settings.MAX_UPLOAD_SIZE // (1024*1024)}MB"
        )

    # ── 2. Extension + MIME double validation ─────────────────────
    filename = file.filename or "unknown"
    ext = ("." + filename.rsplit(".", 1)[-1].lower()) if "." in filename else ""
    mime = magic.from_buffer(content[:2048], mime=True)

    if ext not in settings.ALLOWED_EXTENSIONS or mime not in settings.ALLOWED_MIME_TYPES:
        logger.warning(f"Rejected upload | ext={ext} | mime={mime} | filename={filename}")
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported format: {ext} ({mime}). Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # ── 3. Parse into DataFrame ───────────────────────────────────
    try:
        df = _parse_file(content, ext, file.content_type or "")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Parse failed | ext={ext} | error={e}")
        raise HTTPException(status_code=400, detail=f"Could not parse file: {str(e)}")

    if df is None or (df.empty and df.columns.empty):
        raise HTTPException(status_code=400, detail="Dataset is empty or could not be read.")

    # ── 4. Store for analysis retrieval ──────────────────────────
    dataset_id = str(uuid.uuid4())
    store_dataset(dataset_id, df)

    logger.info(f"Upload complete | dataset_id={dataset_id} | rows={len(df)} | cols={len(df.columns)} | ext={ext}")

    return {
        "dataset_id": dataset_id,
        "rows": len(df),
        "columns": len(df.columns),
        "note": _ingestion_note(ext),
    }


# ── Helpers ───────────────────────────────────────────────────────

def _parse_file(content: bytes, ext: str, content_type: str) -> pd.DataFrame:
    """Parse uploaded bytes into a DataFrame based on file extension."""

    if ext == ".csv" or "csv" in content_type:
        return pd.read_csv(io.BytesIO(content))

    if ext == ".json" or "json" in content_type:
        data = json.loads(content)
        if isinstance(data, dict) and "data" in data:
            data = data["data"]
        if not isinstance(data, list):
            raise HTTPException(
                status_code=400,
                detail="JSON must be a list of records or {'data': [...]}."
            )
        return pd.DataFrame(data)

    if ext == ".pdf" or "pdf" in content_type:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            tables = []
            for page in pdf.pages:
                t = page.extract_table()
                if t:
                    tables.extend(t)
        if not tables:
            raise HTTPException(status_code=400, detail="No tabular data found in PDF.")
        return pd.DataFrame(tables[1:], columns=tables[0])

    if ext == ".docx" or "wordprocessingml" in content_type:
        from docx import Document
        doc = Document(io.BytesIO(content))
        tables = []
        for table in doc.tables:
            tables.extend([[cell.text for cell in row.cells] for row in table.rows])
        if not tables:
            raise HTTPException(status_code=400, detail="No tabular data found in Word file.")
        return pd.DataFrame(tables[1:], columns=tables[0])

    # Default → Excel
    return pd.read_excel(io.BytesIO(content))


def _ingestion_note(ext: str) -> str:
    notes = {
        ".pdf":  "PDF processed — tables extracted into unified structure.",
        ".docx": "Word document parsed — tabular data detected and mapped.",
        ".json": "JSON normalised — records mapped to columnar structure.",
    }
    return notes.get(ext, "Standard dataset normalisation complete.")