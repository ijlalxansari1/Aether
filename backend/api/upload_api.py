import uuid
import pandas as pd
from typing import Union, List, Dict
from fastapi import APIRouter, HTTPException, Body, Request
from core.store import store_dataset
from models.schemas import UploadResponse
from core.limiter import limiter

router = APIRouter()

@router.post("/upload/api", response_model=UploadResponse)
@limiter.limit("10/minute")
async def upload_json_api(request: Request, payload: Union[List, Dict] = Body(...)):
    """
    Direct API ingestion for JSON record sets.
    Expected Format: {"data": [{"col1": "val1", ...}, ...]}
    """
    # Unpack nested "data" keys if present
    data = payload
    if isinstance(data, dict):
        data = data.get("data", data)
    
    while isinstance(data, dict) and "data" in data:
        data = data["data"]
    
    if not isinstance(data, list):
        if isinstance(data, dict):
            # Support single record ingestion
            data = [data]
        else:
            raise HTTPException(status_code=400, detail="Data must be a list of records.")
    
    try:
        df = pd.DataFrame(data)
        if df.empty:
            raise ValueError("Provided recordset is empty.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse JSON records: {str(e)}")
        
    dataset_id = str(uuid.uuid4())
    store_dataset(dataset_id, df)
    
    return {
        "dataset_id": dataset_id,
        "rows": len(df),
        "columns": len(df.columns),
        "note": "API JSON Recordset: Secure injection successful."
    }
