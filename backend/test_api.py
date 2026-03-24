import requests
import json

base_url = "http://localhost:8000"
with open("mock_data.csv", "rb") as f:
    files = {"file": ("mock_data.csv", f, "text/csv")}
    res = requests.post(f"{base_url}/upload", files=files)
    dataset_id = res.json()["dataset_id"]
    
res2 = requests.get(f"{base_url}/analyze/{dataset_id}")
with open("api_response.json", "w") as f:
    json.dump(res2.json(), f, indent=2)
