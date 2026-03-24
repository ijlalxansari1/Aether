export interface UploadResponse {
  dataset_id: string;
  rows: number;
  columns: number;
  note: string;
}

export interface EDAColumn {
  name: string;
  type: string;
  missing_percent: number;
  notes: string;
  _stats?: Record<string, unknown>;
}

export interface EDASummary {
  rows: number;
  columns: number;
}

export interface EDAResult {
  summary: EDASummary;
  columns: EDAColumn[];
  note?: string;
  _correlations?: Record<string, Record<string, number>>;
}

export interface EthicalResult {
  type: string;
  columns: string[];
  risk_level: string;
  message: string;
  recommendations: string[];
}

export interface QualityMetrics {
  completeness: number;
  duplicates: number;
  is_balanced: boolean;
  privacy_risk: string;
}

export interface QualityResult {
  quality_score: number;
  grade: string;
  issues: string[];
  recommendations: string[];
  metrics?: QualityMetrics;
}

export interface FeatureItem {
  name: string;
  signal: string;
  reason: string;
}

export interface FeatureResult {
  important_features: FeatureItem[];
  low_value_features: FeatureItem[];
  risky_features: FeatureItem[];
}

export interface StoryResult {
  title: string;
  chapters: string[];
  system_verdict: string;
}

export interface InsightsResult {
  summary: string;
  insights: string[];
}

export interface AnalysisResponse {
  session_id: string;
  iq_score: number;
  intent: string;
  profile: string;
  eda: EDAResult;
  ethical: EthicalResult;
  quality: QualityResult;
  features?: FeatureResult;
  story?: StoryResult;
  insights: InsightsResult;
}
