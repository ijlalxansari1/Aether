// ─── Core Types ─────────────────────────────────────────────────────────────

export type ColumnType = 'string' | 'number' | 'boolean' | 'date';

export type DataRow = Record<string, string | number | boolean | null>;

export interface DataSchema {
  name: string;
  type: ColumnType;
  nullCount: number;
  uniqueCount: number;
}

export interface IngestedDataset {
  id: string;
  name: string;
  sourceType: 'csv' | 'api' | 'pdf' | 'db';
  headers: string[];
  rows: DataRow[];
  ingestedAt: Date;
}

export interface IngestResult {
  headers: string[];
  rows: DataRow[];
  filename: string;
  ingestedAt: Date;
}

export interface CleaningOp {
  id: string;
  icon: string;
  title: string;
  desc: string;
  applied: boolean;
}

export interface QualityIssue {
  type: 'null' | 'duplicate' | 'outlier';
  column: string;
  count: number;
  severity: 'high' | 'medium' | 'low';
}

export interface ColProfile {
  name: string;
  type: ColumnType;
  count: number;
  nulls: number;
  // numeric
  mean?: number;
  median?: number;
  std?: number;
  min?: number;
  max?: number;
  // categorical
  unique?: number;
  topValue?: string;
  topFreq?: number;
}

export interface KPI {
  label: string;
  value: string | number;
  change: number;
  up: boolean;
}

// ─── Pipeline Stages & Paths ─────────────────────────────────────────────────

export type Stage = 'ingest' | 'discovery' | 'clean' | 'ethics' | 'analyze' | 'story' | 'dashboard' | 'report' | 'model' | 'evaluate' | 'deploy' | 'orchestrate' | 'monitor';

export type UserPath = 'analyst' | 'bi' | 'ds' | null;

// ─── Semantic & Understanding Types ──────────────────────────────────────────

export type SemanticType =
  | 'identifier' | 'dimension' | 'measure' | 'temporal'
  | 'categorical' | 'text' | 'geo' | 'currency' | 'percentage'
  | 'email' | 'phone' | 'name' | 'address' | 'unknown';

export type BusinessDomain =
  | 'ecommerce' | 'healthcare' | 'finance' | 'hr'
  | 'marketing' | 'logistics' | 'education' | 'iot' | 'generic';

export interface ColumnUnderstanding {
  name: string;
  type: ColumnType;
  semanticType: SemanticType;
  nullCount: number;
  nullPercent: number;
  uniqueCount: number;
  uniquePercent: number;
  isSensitive: boolean;
  sampleValues: (string | number | boolean | null)[];
  profile: ColProfile;
}

export interface DerivableMetric {
  name: string;
  formula: string;
  reason: string;
  inputCompleteness: number;
}

export interface DataRelationship {
  col1: string;
  col2: string;
  type: 'correlation' | 'dependency';
  strength: number;
}

export interface DataAnomaly {
  column: string;
  description: string;
  count: number;
}

export interface DataUnderstanding {
  // Schema
  schema: ColumnUnderstanding[];
  rowCount: number;
  columnCount: number;

  // Structure classification
  identifiers: string[];
  dimensions: string[];
  measures: string[];
  temporals: string[];
  sensitiveFields: string[];

  // Quality metrics
  completeness: number;
  duplicateCount: number;
  duplicatePercent: number;
  outlierCount: number;
  corruptRowCount: number;

  // Derived intelligence
  domain: BusinessDomain;
  domainConfidence: number;
  derivableMetrics: DerivableMetric[];
  relationships: DataRelationship[];
  anomalies: DataAnomaly[];

  // Decision Engine output
  recommendations: AetherRecommendation[];
  warnings: AetherWarning[];
}

export interface AetherRecommendation {
  id: string;
  priority: number;
  category: 'quality' | 'analysis' | 'dashboard' | 'prediction' | 'governance';
  title: string;
  description: string;
  reason: string;
  action: string;
  estimatedImpact: 'high' | 'medium' | 'low';
}

export interface AetherWarning {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  column?: string;
  evidence: string;
}

// ─── Visualization Types ─────────────────────────────────────────────────────

export interface BoxPlotData {
  col: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
  outliers: number[];
}

export interface ReportConfig {
  title: string;
  subtitle: string;
  author: string;
  generatedAt: string;
}

export interface AetherState {
  stage: Stage;
  userPath: UserPath;
  datasets: IngestedDataset[];
  headers: string[];
  schema: DataSchema[];
  types: Record<string, ColumnType>;
  raw: DataRow[];
  cleaned: DataRow[];
  filename: string;
  ingestedAt: Date | null;
  cleanOpsApplied: string[];
}

export type StoryBlockType = 'kpi' | 'timeseries' | 'map' | 'composition' | 'correlation' | 'distribution';

export interface StoryBlock {
  id: string;
  type: StoryBlockType;
  title: string;
  description: string;
  width: '100%' | '66.66%' | '50%' | '33.33%';
  config?: Record<string, any>;
}
