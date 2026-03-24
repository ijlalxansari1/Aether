from typing import Dict, Optional, Tuple
import pandas as pd
from datetime import datetime, timedelta

# In-memory storage: dataset_id -> (DataFrame, expiry_timestamp)
_datasets: Dict[str, Tuple[pd.DataFrame, datetime]] = {}
MAX_DATASETS = 20
TTL_MINUTES = 10

def store_dataset(dataset_id: str, df: pd.DataFrame):
    global _datasets
    
    # Clean expired datasets
    now = datetime.now()
    _datasets = {k: v for k, v in _datasets.items() if v[1] > now}
    
    # Enforce max capacity (LRU/FIFO approximation by expiry)
    if len(_datasets) >= MAX_DATASETS:
        oldest_id = min(_datasets.keys(), key=lambda k: _datasets[k][1])
        del _datasets[oldest_id]
        
    # Store new dataset
    expiry = now + timedelta(minutes=TTL_MINUTES)
    _datasets[dataset_id] = (df, expiry)

def get_dataset(dataset_id: str) -> Optional[pd.DataFrame]:
    if dataset_id not in _datasets:
        return None
        
    df, expiry = _datasets[dataset_id]
    if datetime.now() > expiry:
        del _datasets[dataset_id]
        return None
        
    return df
