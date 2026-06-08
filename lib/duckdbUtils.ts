import * as duckdb from '@duckdb/duckdb-wasm';
import { DataRow } from './types';

let dbInstance: duckdb.AsyncDuckDB | null = null;

export async function getDb(): Promise<duckdb.AsyncDuckDB> {
  if (dbInstance) return dbInstance;

  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

  const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker!}");`], { type: 'text/javascript' })
  );

  const worker = new Worker(worker_url);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);

  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(worker_url);

  dbInstance = db;
  return dbInstance;
}

export async function loadDataToTable(db: duckdb.AsyncDuckDB, tableName: string, data: DataRow[]) {
  const jsonStr = JSON.stringify(data);
  const encoder = new TextEncoder();
  const buffer = encoder.encode(jsonStr);

  await db.registerFileBuffer(`${tableName}.json`, buffer);
  
  const conn = await db.connect();
  // Create table by reading the JSON file
  await conn.query(`CREATE OR REPLACE TABLE ${tableName} AS SELECT * FROM read_json_auto('${tableName}.json')`);
  await conn.close();
}

export async function executeQuery(db: duckdb.AsyncDuckDB, query: string): Promise<DataRow[]> {
  const conn = await db.connect();
  const arrowResult = await conn.query(query);
  await conn.close();
  
  // Arrow to JSON array
  return arrowResult.toArray().map((row: any) => row.toJSON());
}

export async function exportToParquet(db: duckdb.AsyncDuckDB, tableName: string): Promise<Uint8Array> {
  const conn = await db.connect();
  const parquetFileName = `${tableName}_export.parquet`;
  
  await conn.query(`COPY ${tableName} TO '${parquetFileName}' (FORMAT PARQUET);`);
  
  const buffer = await db.copyFileToBuffer(parquetFileName);
  await conn.close();
  
  return buffer;
}
