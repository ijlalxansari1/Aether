import { getDb, loadDataToTable, executeQuery, exportToParquet } from '@/lib/duckdbUtils';
import * as duckdb from '@duckdb/duckdb-wasm';

jest.mock('@duckdb/duckdb-wasm', () => {
  const mockConn = {
    query: jest.fn().mockResolvedValue({
      toArray: () => [{ id: 1, name: 'Test' }].map(r => ({ toJSON: () => r }))
    }),
    close: jest.fn().mockResolvedValue(true)
  };
  
  const mockDb = {
    instantiate: jest.fn().mockResolvedValue(true),
    registerFileBuffer: jest.fn().mockResolvedValue(true),
    connect: jest.fn().mockResolvedValue(mockConn),
    copyFileToBuffer: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
  };

  return {
    getJsDelivrBundles: jest.fn().mockReturnValue({}),
    selectBundle: jest.fn().mockResolvedValue({
      mainWorker: 'worker.js',
      mainModule: 'module.wasm',
      pthreadWorker: 'pthread.js'
    }),
    ConsoleLogger: jest.fn().mockImplementation(() => ({})),
    AsyncDuckDB: jest.fn().mockImplementation(() => mockDb)
  };
});

describe('duckdbUtils', () => {
  beforeAll(() => {
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn().mockReturnValue('blob:http://localhost/worker.js');
    global.URL.revokeObjectURL = jest.fn();
    // Mock Worker
    global.Worker = jest.fn().mockImplementation(() => ({})) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getDb initializes and returns db instance', async () => {
    const db = await getDb();
    expect(db).toBeDefined();
    expect(duckdb.AsyncDuckDB).toHaveBeenCalled();
  });

  it('loadDataToTable registers buffer and creates table', async () => {
    const db = await getDb();
    const data = [{ id: 1, name: 'Test' }];
    await loadDataToTable(db, 'my_table', data);

    expect(db.registerFileBuffer).toHaveBeenCalledWith('my_table.json', expect.any(Uint8Array));
    const conn = await db.connect();
    expect(conn.query).toHaveBeenCalledWith(expect.stringContaining('CREATE OR REPLACE TABLE my_table AS SELECT * FROM read_json_auto(\'my_table.json\')'));
  });

  it('executeQuery runs sql and returns JSON', async () => {
    const db = await getDb();
    const result = await executeQuery(db, 'SELECT * FROM my_table');
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ id: 1, name: 'Test' });
  });

  it('exportToParquet copies to buffer', async () => {
    const db = await getDb();
    const buffer = await exportToParquet(db, 'my_table');
    
    expect(buffer).toBeInstanceOf(Uint8Array);
    expect(buffer.length).toBeGreaterThan(0);
  });
});
