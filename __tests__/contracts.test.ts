import { analyzeDataset } from '../lib/dataUnderstanding';
import { splitQuarantine } from '../lib/dataUtils';
import { determineIngestionStrategy, SOURCE_REGISTRY } from '../lib/sourceRegistry';
import { DataRow } from '../lib/types';

describe('Aether Testing Pyramid & Boundary Contracts', () => {

  // Contract 2: Canonical Dataset Normalization mock input rows
  const rawPostgresRows = [
    { order_id: 101, customer_id: 'C_99', order_date: '2026-08-01', revenue: 250.0, quantity: 2 },
    { order_id: 102, customer_id: 'C_98', order_date: '2026-08-02', revenue: 120.0, quantity: 1 }
  ];

  const rawCSVRows = [
    { order_id: '101', customer_id: 'C_99', order_date: '2026-08-01', revenue: '250.0', quantity: '2' },
    { order_id: '102', customer_id: 'C_98', order_date: '2026-08-02', revenue: '120.0', quantity: '1' }
  ];

  const rawS3ParquetRows = [
    { order_id: 101, customer_id: 'C_99', order_date: '2026-08-01', revenue: 250.0, quantity: 2 },
    { order_id: 102, customer_id: 'C_98', order_date: '2026-08-02', revenue: 120.0, quantity: 1 }
  ];

  const headers = ['order_id', 'customer_id', 'order_date', 'revenue', 'quantity'];

  test('Contract 1: Source Capability Registry retrieves correct limits and config parameters', () => {
    const pgCaps = SOURCE_REGISTRY['postgres'];
    expect(pgCaps.pushdownSupport).toBe(true);
    expect(pgCaps.querySupport).toBe(true);
    expect(pgCaps.maxInMemoryRows).toBe(1000000);

    const csvCaps = SOURCE_REGISTRY['csv'];
    expect(csvCaps.pushdownSupport).toBe(false);
    expect(csvCaps.querySupport).toBe(false);

    // Adaptive Ingestion Strategy selection
    const smallStrategy = determineIngestionStrategy('postgres', 50000);
    expect(smallStrategy.action).toBe('extract_full');

    const largeStrategy = determineIngestionStrategy('postgres', 2500000);
    expect(largeStrategy.action).toBe('pushdown_query');
    expect(largeStrategy.limitApplied).toBe(1000000);
  });

  test('Contract 2: Canonical dataset logic normalizes structures correctly', () => {
    // Normalizes empty/null structures safely
    const corruptRow = { order_id: null, customer_id: null, order_date: null, revenue: null, quantity: null };
    const mixedRows = [...rawPostgresRows, corruptRow];

    const { cleanRows, quarantinedRows } = splitQuarantine(headers, mixedRows);
    
    // Corrupt row (>80% null) is successfully quarantined
    expect(cleanRows.length).toBe(2);
    expect(quarantinedRows.length).toBe(1);
    expect(quarantinedRows[0]).toEqual(corruptRow);
  });

  test('Contract 3: Intelligence recommendations remain identical across different formats containing same logical records', () => {
    // Both datasets carry same structure and domain semantics
    const headersMock = ['order_id', 'customer_id', 'order_date', 'revenue', 'quantity'];
    
    // Map string values to correct types for CSV representation testing
    const parsedCSVRows = rawCSVRows.map(r => ({
      order_id: Number(r.order_id),
      customer_id: r.customer_id,
      order_date: r.order_date,
      revenue: Number(r.revenue),
      quantity: Number(r.quantity)
    }));

    const analysisPostgres = analyzeDataset(headersMock, rawPostgresRows);
    const analysisCSV = analyzeDataset(headersMock, parsedCSVRows);

    // Schema understanding
    expect(analysisPostgres.domain).toBe('ecommerce');
    expect(analysisCSV.domain).toBe('ecommerce');

    // Categorized columns are matching
    expect(analysisPostgres.identifiers).toEqual(analysisCSV.identifiers);
    expect(analysisPostgres.measures).toEqual(analysisCSV.measures);

    // Decisions match
    const pgRecTitles = analysisPostgres.recommendations.map(r => r.title);
    const csvRecTitles = analysisCSV.recommendations.map(r => r.title);
    expect(pgRecTitles).toEqual(csvRecTitles);
  });

});
