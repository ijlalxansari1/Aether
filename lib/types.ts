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

export type Stage = 'ingest' | 'store' | 'clean' | 'path-selection' | 'ethics' | 'analyze' | 'story' | 'dashboard' | 'report' | 'model' | 'evaluate' | 'deploy';

export type UserPath = 'analyst' | 'bi' | 'ds' | null;

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

export interface DataContractRule {
  id: string;
  column: string;
  operator: '>' | '<' | '==' | '!=' | 'contains' | 'not_null';
  value: string;
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
