'use client';

import { useState, useCallback } from 'react';
import PipelineBar from '@/components/PipelineBar';
import IngestStage from '@/components/stages/IngestStage';
import StoreStage from '@/components/stages/StoreStage';
import CleanStage from '@/components/stages/CleanStage';
import AnalyzeStage from '@/components/stages/AnalyzeStage';
import StoryStage from '@/components/stages/StoryStage';
import DashboardStage from '@/components/stages/DashboardStage';
import ReportStage from '@/components/stages/ReportStage';
import LandingHero from '@/components/LandingHero';
import { Stage, DataRow, DataSchema } from '@/lib/types';
import { inferTypes, detectIssues, applyCleanOp, profileColumn, findReplace, dropColumn } from '@/lib/dataUtils';

const CLEANING_ALL = ['remove_dups', 'fill_nulls', 'cap_outliers', 'trim_spaces', 'normalize', 'fix_types'];

export default function AetherApp() {
  const [stage, setStage] = useState<Stage>('ingest');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<DataRow[]>([]);
  const [cleanedRows, setCleanedRows] = useState<DataRow[]>([]);
  const [types, setTypes] = useState<Record<string, ReturnType<typeof inferTypes>[string]>>({});
  const [schema, setSchema] = useState<DataSchema[]>([]);
  const [filename, setFilename] = useState('');
  const [ingestedAt, setIngestedAt] = useState<Date | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [appliedOps, setAppliedOps] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [showHero, setShowHero] = useState(true);

  function showToast(msg: string, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // ── Ingest ──────────────────────────────────────────────────────────────────
  const handleIngest = useCallback((hdrs: string[], rows: DataRow[], fname: string) => {
    const t = inferTypes(hdrs, rows);
    const sch: DataSchema[] = hdrs.map(h => {
      const p = profileColumn(h, t[h], rows);
      return { name: h, type: t[h], nullCount: p.nulls, uniqueCount: p.unique ?? rows.length };
    });
    setHeaders(hdrs);
    setRawRows(rows);
    setCleanedRows(JSON.parse(JSON.stringify(rows)));
    setTypes(t);
    setSchema(sch);
    setFilename(fname);
    setIngestedAt(new Date());
    setAppliedOps(new Set());
    setLogs([
      `» File: ${fname}`,
      `» Rows detected: ${rows.length}`,
      `» Columns: ${hdrs.length} → [${hdrs.join(', ')}]`,
      `» Types inferred: ${hdrs.map(h => `${h}:${t[h]}`).join(' | ')}`,
      `» ✅ Ingestion complete — ready for storage.`,
    ]);
    setShowHero(false);
    showToast(`✓ Ingested ${rows.length} rows`, 'success');
  }, []);

  // ── Clean Ops ────────────────────────────────────────────────────────────────
  function handleApplyOp(id: string) {
    if (appliedOps.has(id)) return;
    setCleanedRows(prev => applyCleanOp(id, prev, headers, types));
    setAppliedOps(prev => new Set([...prev, id]));
    showToast(`✓ Applied: ${id.replace(/_/g, ' ')}`, 'success');
  }

  function handleApplyAll() {
    let rows = [...cleanedRows];
    const newOps = new Set(appliedOps);
    CLEANING_ALL.forEach(id => {
      if (!newOps.has(id)) { rows = applyCleanOp(id, rows, headers, types); newOps.add(id); }
    });
    setCleanedRows(rows);
    setAppliedOps(newOps);
    showToast('✅ All cleaning operations applied!', 'success');
  }

  // ── Advanced Clean ────────────────────────────────────────────────────────────
  function handleFindReplace(col: string, find: string, replace: string) {
    setCleanedRows(prev => findReplace(col, find, replace, prev));
    showToast(`✓ Replaced "${find}" → "${replace}" in ${col}`, 'success');
  }

  function handleDropColumn(col: string) {
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
    showToast(`✓ Dropped column: ${col}`, 'success');
  }

  const issues = detectIssues(headers, rawRows, types);

  return (
    <div className="app-root">
      {/* Topbar */}
      <header className="topbar">
        <div className="logo-wrap">
          <div className="logo-icon">✦</div>
          <span className="logo-text">Aether</span>
          <span className="logo-tagline">End-to-End DataOps</span>
        </div>
        <div className="topbar-right">
          {headers.length > 0 && (
            <span className="data-badge">{rawRows.length}R × {headers.length}C</span>
          )}
          <span className="version-badge">MVP v1.0</span>
        </div>
      </header>

      {showHero && rawRows.length === 0 && (
        <LandingHero onScroll={() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          setShowHero(false);
        }} />
      )}

      {(!showHero || rawRows.length > 0) && (
        <>
          {/* Pipeline */}
          <PipelineBar
            current={stage}
            hasData={rawRows.length > 0}
            onStageClick={setStage}
          />

      {/* Stage content */}
      <main className="main-content">
        {stage === 'ingest' && (
          <IngestStage
            onIngest={handleIngest}
            logs={logs}
            hasData={rawRows.length > 0}
            rowCount={rawRows.length}
            colCount={headers.length}
            onProceed={() => setStage('store')}
          />
        )}
        {stage === 'store' && (
          <StoreStage
            headers={headers}
            schema={schema}
            rows={cleanedRows}
            filename={filename}
            ingestedAt={ingestedAt}
            onProceed={() => setStage('clean')}
          />
        )}
        {stage === 'clean' && (
          <CleanStage
            headers={headers}
            types={types}
            rawRows={rawRows}
            cleanedRows={cleanedRows}
            issues={issues}
            appliedOps={appliedOps}
            onApplyOp={handleApplyOp}
            onApplyAll={handleApplyAll}
            onFindReplace={handleFindReplace}
            onDropColumn={handleDropColumn}
            onProceed={() => setStage('analyze')}
          />
        )}
        {stage === 'analyze' && (
          <AnalyzeStage
            headers={headers}
            types={types}
            rows={cleanedRows}
            onProceed={() => setStage('story')}
          />
        )}
        {stage === 'story' && (
          <StoryStage
            headers={headers}
            types={types}
            rows={cleanedRows}
            appliedOps={appliedOps}
            onProceed={() => setStage('dashboard')}
          />
        )}
        {stage === 'dashboard' && (
          <DashboardStage
            headers={headers}
            types={types}
            rows={cleanedRows}
            filename={filename}
            onProceed={() => setStage('report')}
          />
        )}
        {stage === 'report' && (
          <ReportStage
            headers={headers}
            types={types}
            rows={cleanedRows}
            rawRows={rawRows}
            filename={filename}
            appliedOps={appliedOps}
            ingestedAt={ingestedAt}
          />
        )}
      </main>
      </>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.type === 'success' ? '✓' : '✗'}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
