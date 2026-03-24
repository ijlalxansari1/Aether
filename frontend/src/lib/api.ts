import { UploadResponse, AnalysisResponse } from "../types/analysis";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || "Upload failed");
  }

  return res.json();
}

export async function uploadJson(data: any): Promise<UploadResponse> {
  const res = await fetch(`${API_BASE}/upload/api`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || "JSON Upload failed");
  }

  return res.json();
}

export async function analyzeDataset(datasetId: string, intent: string): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/analyze/${datasetId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ intent }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    
    if (res.status === 404) {
      throw new Error("Session expired — please re-upload");
    }
    
    throw new Error(errorData?.detail || errorData?.error || "Analysis failed");
  }

  return res.json();
}

export async function runFullAnalysis(
  file: File, 
  intent: string, 
  onUploadComplete?: (datasetId: string) => void
): Promise<AnalysisResponse> {
  const uploadData = await uploadFile(file);
  
  if (onUploadComplete) {
    onUploadComplete(uploadData.dataset_id);
  }
  
  return analyzeDataset(uploadData.dataset_id, intent);
}
