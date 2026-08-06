import { ColumnType } from './types';

export type SourceType = 'csv' | 'json' | 'excel' | 'api' | 'postgres' | 'snowflake' | 'bigquery' | 's3' | 'kafka';

export interface SourceCapabilities {
  type: SourceType;
  label: string;
  schemaSupport: boolean;
  querySupport: boolean;
  pushdownSupport: boolean;
  streamingSupport: boolean;
  partitionSupport: boolean;
  maxInMemoryRows: number;
  authTypes: string[];
}

export interface IngestionStrategy {
  action: 'extract_full' | 'sample_source' | 'pushdown_query';
  reason: string;
  limitApplied?: number;
}

export const SOURCE_REGISTRY: Record<SourceType, SourceCapabilities> = {
  csv: {
    type: 'csv',
    label: 'Local CSV File',
    schemaSupport: false,
    querySupport: false,
    pushdownSupport: false,
    streamingSupport: false,
    partitionSupport: false,
    maxInMemoryRows: 100000,
    authTypes: ['none']
  },
  json: {
    type: 'json',
    label: 'Local JSON File',
    schemaSupport: false,
    querySupport: false,
    pushdownSupport: false,
    streamingSupport: false,
    partitionSupport: false,
    maxInMemoryRows: 50000,
    authTypes: ['none']
  },
  excel: {
    type: 'excel',
    label: 'Excel Spreadsheet',
    schemaSupport: false,
    querySupport: false,
    pushdownSupport: false,
    streamingSupport: false,
    partitionSupport: false,
    maxInMemoryRows: 30000,
    authTypes: ['none']
  },
  api: {
    type: 'api',
    label: 'REST API Webhook',
    schemaSupport: false,
    querySupport: false,
    pushdownSupport: false,
    streamingSupport: true,
    partitionSupport: false,
    maxInMemoryRows: 10000,
    authTypes: ['apiKey', 'bearerToken', 'basic']
  },
  postgres: {
    type: 'postgres',
    label: 'PostgreSQL Relational DB',
    schemaSupport: true,
    querySupport: true,
    pushdownSupport: true,
    streamingSupport: false,
    partitionSupport: true,
    maxInMemoryRows: 1000000,
    authTypes: ['usernamePassword']
  },
  snowflake: {
    type: 'snowflake',
    label: 'Snowflake Data Warehouse',
    schemaSupport: true,
    querySupport: true,
    pushdownSupport: true,
    streamingSupport: false,
    partitionSupport: true,
    maxInMemoryRows: 5000000,
    authTypes: ['usernamePassword', 'keyPair']
  },
  bigquery: {
    type: 'bigquery',
    label: 'Google BigQuery',
    schemaSupport: true,
    querySupport: true,
    pushdownSupport: true,
    streamingSupport: true,
    partitionSupport: true,
    maxInMemoryRows: 10000000,
    authTypes: ['serviceAccount']
  },
  s3: {
    type: 's3',
    label: 'AWS S3 Bucket',
    schemaSupport: true, // If Parquet
    querySupport: false,
    pushdownSupport: false,
    streamingSupport: false,
    partitionSupport: true,
    maxInMemoryRows: 1000000,
    authTypes: ['awsCredentials']
  },
  kafka: {
    type: 'kafka',
    label: 'Apache Kafka Stream',
    schemaSupport: false,
    querySupport: false,
    pushdownSupport: false,
    streamingSupport: true,
    partitionSupport: true,
    maxInMemoryRows: 100000,
    authTypes: ['sasl', 'none']
  }
};

export function determineIngestionStrategy(
  type: SourceType,
  estimatedRows: number
): IngestionStrategy {
  const caps = SOURCE_REGISTRY[type];
  if (!caps) {
    return {
      action: 'extract_full',
      reason: 'Unknown source type. Defaulting to full extraction.'
    };
  }

  // Large tables on databases/datawarehouses with pushdown capabilities
  if (estimatedRows > caps.maxInMemoryRows) {
    if (caps.pushdownSupport && caps.querySupport) {
      return {
        action: 'pushdown_query',
        reason: `Dataset exceeds the in-memory threshold (${estimatedRows.toLocaleString()} > ${caps.maxInMemoryRows.toLocaleString()}). SQL query execution and aggregations will be pushed down directly to the source.`,
        limitApplied: caps.maxInMemoryRows
      };
    } else {
      // Large file or API that cannot be query-pushed-down -> must sample/limit
      return {
        action: 'sample_source',
        reason: `Dataset size exceeds safe browser execution memory (${estimatedRows.toLocaleString()} > ${caps.maxInMemoryRows.toLocaleString()}). Source does not support pushdown queries; a sample subset will be parsed.`,
        limitApplied: caps.maxInMemoryRows
      };
    }
  }

  return {
    action: 'extract_full',
    reason: `Dataset size is within safe bounds (${estimatedRows.toLocaleString()} rows). Aether will load the entire dataset into memory for sub-second visual reactivity.`
  };
}
