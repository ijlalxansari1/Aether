'use client';

import { useState, useMemo } from 'react';
import { useWorkspace } from '@/components/WorkspaceContext';
import CleanStage from '@/components/stages/CleanStage';
import DiscoveryStage from '@/components/stages/DiscoveryStage';
import { useRouter } from 'next/navigation';
import { 
  inferTypes, 
  detectIssues, 
  applyCleanOp, 
  findReplace, 
  dropColumn, 
  splitQuarantine,
  profileColumn
} from '@/lib/dataUtils';

const CLEANING_ALL = ['remove_dups', 'fill_nulls', 'cap_outliers', 'trim_spaces', 'normalize', 'fix_types'];

export default function DataEngineeringPage() {
  const { 
    rawRows, setRawRows,
    cleanedRows, setCleanedRows, 
    headers, setHeaders,
    types, setTypes,
    schema, setSchema,
    appliedOps, setAppliedOps,
    userRole, loading, dataset 
  } = useWorkspace();

  const [subStage, setSubStage] = useState<'discovery' | 'clean'>('discovery');
  const [rowHistory, setRowHistory] = useState<{rows: any[], ops: Set<string>}[]>([]);
  const router = useRouter();

  const isReadOnly = userRole !== 'de' && userRole !== 'admin';

  // Compute stats and issues
  const issues = useMemo(() => detectIssues(headers, rawRows, types), [headers, rawRows, types]);

  // Sub-stage transition functions
  function pushHistory() {
    setRowHistory(prev => [...prev, { rows: [...cleanedRows], ops: new Set(appliedOps) }]);
  }

  function handleTimeTravel(index: number) {
    if (index >= rowHistory.length) return;
    const h = rowHistory[index];
    setCleanedRows(h.rows);
    setAppliedOps(h.ops);
    setRowHistory(prev => prev.slice(0, index));
  }

  function handleApplyOp(id: string) {
    if (appliedOps.has(id)) return;
    pushHistory();
    setCleanedRows(applyCleanOp(id, cleanedRows, headers, types));
    setAppliedOps(new Set([...appliedOps, id]));
  }

  function handleApplyAll() {
    pushHistory();
    let rows = [...cleanedRows];
    let currentHeaders = [...headers];
    
    // Drop columns with > 50% nulls
    const colsToDrop = currentHeaders.filter(h => {
      const nulls = rows.filter(r => r[h] === null || r[h] === undefined || r[h] === '').length;
      return nulls / (rows.length || 1) > 0.5;
    });

    if (colsToDrop.length > 0) {
      colsToDrop.forEach(col => {
        const result = dropColumn(col, currentHeaders, rows);
        currentHeaders = result.headers;
        rows = result.rows;
      });
      setHeaders(currentHeaders);
    }

    const newOps = new Set(appliedOps);
    CLEANING_ALL.forEach(id => {
      if (!newOps.has(id)) { 
        rows = applyCleanOp(id, rows, currentHeaders, types); 
        newOps.add(id); 
      }
    });
    setCleanedRows(rows);
    setAppliedOps(newOps);
  }

  function handleFindReplace(col: string, find: string, replace: string) {
    pushHistory();
    setCleanedRows(findReplace(col, find, replace, cleanedRows));
  }

  function handleDropColumn(col: string) {
    pushHistory();
    const result = dropColumn(col, headers, cleanedRows);
    const rawResult = dropColumn(col, headers, rawRows);
    
    const newTypes = { ...types };
    delete newTypes[col];
    const newSchema = schema.filter(s => s.name !== col);
    
    setHeaders(result.headers);
    setCleanedRows(result.rows);
    setRawRows(rawResult.rows);
    setTypes(newTypes);
    setSchema(newSchema);
  }

  if (loading) return null;

  return (
    <>
      {isReadOnly && <div style={{ background: 'var(--bg-card)', padding: '16px', color: 'var(--text-muted)' }}>Viewing in Read-Only mode. Only Data Engineers can alter the pipeline structure.</div>}
      
      {subStage === 'discovery' ? (
        <DiscoveryStage
          headers={headers}
          rows={cleanedRows}
          filename={dataset?.name || 'Untitled Workspace'}
          ingestedAt={dataset?.ingestedAt ? new Date(dataset.ingestedAt) : null}
          quarantinedCount={0}
          sourceType={(dataset?.sourceType || 'csv') as any}
          onProceed={() => setSubStage('clean')}
          onNavigate={(tgt) => {
            if (tgt === 'clean') setSubStage('clean');
            else router.push(`/workspace/${dataset?.id}/${tgt}`);
          }}
        />
      ) : (
        <CleanStage 
          rawRows={rawRows}
          cleanedRows={cleanedRows}
          quarantinedRows={[]}
          previousRows={rowHistory.length > 0 ? rowHistory[rowHistory.length - 1].rows : rawRows}
          issues={issues}
          onApplyOp={handleApplyOp}
          onApplyAll={handleApplyAll}
          onFindReplace={handleFindReplace}
          onDropColumn={handleDropColumn}
          onTimeTravel={handleTimeTravel}
          onRestoreQuarantine={() => {}}
          onDropQuarantine={() => {}}
          onConsolidateCategories={(col) => {
            import('@/lib/dataUtils').then(({ consolidateCategories }) => {
              pushHistory();
              setCleanedRows(consolidateCategories(cleanedRows, col, 2));
            });
          }}
          rowHistoryLength={rowHistory.length}
          headers={headers} 
          types={types}
          appliedOps={appliedOps}
          onAddDataset={() => router.push('/')}
          onProceed={() => router.push(`/workspace/${dataset?.id}/da`)}
        />
      )}
    </>
  );
}
