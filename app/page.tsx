'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import localforage from 'localforage';
import PipelineBar from '@/components/PipelineBar';
import IngestStage from '@/components/stages/IngestStage';
import StoreStage from '@/components/stages/StoreStage';
import CleanStage from '@/components/stages/CleanStage';
import AnalyzeStage from '@/components/stages/AnalyzeStage';
import StoryStage from '@/components/stages/StoryStage';
import DashboardStage from '@/components/stages/DashboardStage';
import ReportStage from '@/components/stages/ReportStage';
import LandingHero from '@/components/LandingHero';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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

  // ── Auth ────────────────────────────────────────────────────────────────────
  const [user, setUser] = useState<{id: number, email: string} | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // ── Progress Saving ────────────────────────────────────────────────────────
  const [hasSavedSession, setHasSavedSession] = useState(false);

  useEffect(() => {
    // Check if there's a local workspace
    localforage.getItem('aether_workspace').then(data => {
      if (data) setHasSavedSession(true);
    });
    // Optional: check if user session cookie exists by doing a quick fetch to /api/workspaces
    fetch('/api/workspaces').then(res => res.json()).then(data => {
      if (data.success) {
        setUser({ id: 0, email: 'Connected User' }); // Basic mock user state, JWT is in cookie
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (rawRows.length > 0) {
      localforage.setItem('aether_workspace', {
        headers, types, schema, filename, ingestedAt,
        stage, appliedOps: Array.from(appliedOps),
        rawRows, cleanedRows
      });
    }
  }, [rawRows, cleanedRows, stage, appliedOps]);

  async function loadWorkspace() {
    const data: any = await localforage.getItem('aether_workspace');
    if (!data) return;
    setHeaders(data.headers);
    setTypes(data.types);
    setSchema(data.schema);
    setFilename(data.filename);
    setIngestedAt(data.ingestedAt);
    setStage(data.stage);
    setAppliedOps(new Set(data.appliedOps));
    setRawRows(data.rawRows);
    setCleanedRows(data.cleanedRows);
    setShowHero(false);
    showToast('Workspace resumed from local storage!', 'success');
  }

  async function saveToCloud() {
    if (!user) {
      showToast('Please sign in to save to the cloud', 'error');
      setShowAuthModal(true);
      return;
    }
    const pipeline_state = JSON.stringify({
      headers, types, schema, filename, ingestedAt,
      stage, appliedOps: Array.from(appliedOps),
      rawRows, cleanedRows
    });
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: filename || 'Untitled Workspace', pipeline_state })
      });
      const data = await res.json();
      if (data.success) showToast('Workspace saved to cloud!', 'success');
      else showToast(data.error || 'Failed to save', 'error');
    } catch (err) {
      showToast('Cloud save failed', 'error');
    }
  }

  async function handleAuth() {
    setAuthLoading(true);
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setShowAuthModal(false);
        showToast(authMode === 'login' ? 'Signed in successfully' : 'Registered successfully', 'success');
      } else {
        showToast(data.error || 'Authentication failed', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      setAuthLoading(false);
    }
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

  function handleUpdateRows(newHeaders: string[], newRows: DataRow[]) {
    const t = inferTypes(newHeaders, newRows);
    const sch: DataSchema[] = newHeaders.map(h => {
      const p = profileColumn(h, t[h], newRows);
      return { name: h, type: t[h], nullCount: p.nulls, uniqueCount: p.unique ?? newRows.length };
    });
    setHeaders(newHeaders);
    setCleanedRows(newRows);
    setTypes(t);
    setSchema(sch);
    showToast(`✓ Pipeline updated via SQL! (${newRows.length} rows)`, 'success');
  }

  const issues = useMemo(() => detectIssues(headers, rawRows, types), [headers, rawRows, types]);

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
          {user ? (
            <div className="flex gap-8" style={{ alignItems: 'center', marginRight: 16 }}>
              {rawRows.length > 0 && (
                <button className="btn btn-sm btn-secondary" onClick={saveToCloud}>☁️ Save to Cloud</button>
              )}
              <span className="version-badge" style={{ background: 'var(--emerald)', color: '#fff', border: 'none', cursor: 'pointer' }} onClick={() => setUser(null)}>👤 {user.email.split('@')[0]}</span>
            </div>
          ) : (
            <button className="btn btn-sm btn-primary" style={{ marginRight: 16 }} onClick={() => setShowAuthModal(true)}>Sign In</button>
          )}
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
        }} hasSavedSession={hasSavedSession} onResume={loadWorkspace} />
      )}

      {(!showHero || rawRows.length > 0) && (
        <ErrorBoundary>
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
            onError={msg => showToast(msg, 'error')}
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
            onUpdateRows={handleUpdateRows}
            onError={(msg) => showToast(msg, 'error')}
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
      </ErrorBoundary>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.type === 'success' ? '✓' : '✗'}</span>
          {toast.msg}
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ minWidth: 320 }}>
            <h2 style={{ marginBottom: 16 }}>{authMode === 'login' ? 'Sign In' : 'Create Account'}</h2>
            <input type="email" placeholder="Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="search-input" style={{ width: '100%', marginBottom: 12 }} />
            <input type="password" placeholder="Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="search-input" style={{ width: '100%', marginBottom: 20 }} />
            
            <div style={{ marginBottom: 16, fontSize: '0.85rem' }}>
              {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <a href="#" style={{ color: 'var(--emerald)' }} onClick={(e) => { e.preventDefault(); setAuthMode(authMode === 'login' ? 'register' : 'login'); }}>
                {authMode === 'login' ? 'Register here' : 'Login here'}
              </a>
            </div>

            <div className="flex gap-8" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowAuthModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAuth} disabled={authLoading}>
                {authLoading ? '...' : authMode === 'login' ? 'Login' : 'Register'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
