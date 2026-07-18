import * as duckdb from '@duckdb/duckdb-wasm';
import { DataRow } from './types';

let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
  mvp: {
    mainModule: '/duckdb-mvp.wasm',
    mainWorker: '/duckdb-browser-mvp.worker.js',
  },
  eh: {
    mainModule: '/duckdb-eh.wasm',
    mainWorker: '/duckdb-browser-eh.worker.js',
  },
};

export async function getDb(): Promise<duckdb.AsyncDuckDB> {
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);

    // Directly use local worker file - no Blob, no fetch, no importScripts!
    const worker = new Worker(bundle.mainWorker!);
    const logger = new duckdb.ConsoleLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);

    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

    return db;
  })();

  return dbPromise;
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
  
  // Arrow to JSON array, and convert BigInt to Number
  return arrowResult.toArray().map((row: any) => {
    const obj = row.toJSON();
    for (const key in obj) {
      if (typeof obj[key] === 'bigint') {
        obj[key] = Number(obj[key]);
      }
    }
    return obj;
  });
}

export async function exportToParquet(db: duckdb.AsyncDuckDB, tableName: string): Promise<Uint8Array> {
  const conn = await db.connect();
  const parquetFileName = `${tableName}_export.parquet`;
  
  await conn.query(`COPY ${tableName} TO '${parquetFileName}' (FORMAT PARQUET);`);
  
  const buffer = await db.copyFileToBuffer(parquetFileName);
  await conn.close();
  
  return buffer;
}
