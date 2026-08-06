'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import localforage from 'localforage';
import PipelineBar from '@/components/PipelineBar';
import IngestStage from '@/components/stages/IngestStage';
import DiscoveryStage from '@/components/stages/DiscoveryStage';
import CleanStage from '@/components/stages/CleanStage';
import EthicsStage from '@/components/stages/EthicsStage';
import AnalyzeStage from '@/components/stages/AnalyzeStage';
import DashboardStage from '@/components/stages/DashboardStage';
import ReportStage from '@/components/stages/ReportStage';
import StoryStage from '@/components/stages/StoryStage';
import ModelStage from '@/components/stages/ModelStage';
import EvaluateStage from '@/components/stages/EvaluateStage';
import DeployStage from '@/components/stages/DeployStage';
import OrchestrateStage from '@/components/stages/OrchestrateStage';
import MonitorStage from '@/components/stages/MonitorStage';
import GlobalSidebar from '@/components/GlobalSidebar';
import AIAssistant from '@/components/AIAssistant';
import LandingHero from '@/components/LandingHero';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Stage, UserPath, DataRow, DataSchema } from '@/lib/types';
import { inferTypes, detectIssues, applyCleanOp, profileColumn, findReplace, dropColumn, splitQuarantine, smartCastData } from '@/lib/dataUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox, Hammer, BarChart3, Presentation, Rocket, Search, User as UserIcon, Save, FolderOpen } from 'lucide-react';

const CLEANING_ALL = ['remove_dups', 'fill_nulls', 'cap_outliers', 'trim_spaces', 'normalize', 'fix_types'];

export default function AetherApp() {
  const [stage, setStage] = useState<Stage>('ingest');
  const [userPath, setUserPath] = useState<UserPath>(null);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<DataRow[]>([]);
  const [cleanedRows, setCleanedRows] = useState<DataRow[]>([]);
  const [quarantinedRows, setQuarantinedRows] = useState<DataRow[]>([]);
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

  // ── Streaming State ────────────────────────────────────────────────────────
  const [streamQueue, setStreamQueue] = useState<DataRow[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (!isStreaming || streamQueue.length === 0) return;
    const interval = setInterval(() => {
      setStreamQueue(prev => {
        if (prev.length === 0) {
          setIsStreaming(false);
          clearInterval(interval);
          return [];
        }
        const chunk = prev.slice(0, 25); // 25 rows per second
        const remainder = prev.slice(25);
        
        setRawRows(r => [...r, ...chunk]);
        setCleanedRows(r => [...r, ...chunk]);
        
        return remainder;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isStreaming, streamQueue]);

  useEffect(() => {
    // Check if there's a local workspace
    localforage.getItem('aether_workspace').then(data => {
      if (data) setHasSavedSession(true);
    });
    // Check if user session cookie exists before fetching
    if (document.cookie.includes('auth_token')) {
      fetch('/api/workspaces').then(res => {
        if (res.ok) return res.json();
        return null;
      }).then(data => {
        if (data?.success) {
          setUser({ id: 0, email: 'Connected User' }); 
        }
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (rawRows.length > 0 || datasets.length > 0) {
      localforage.setItem('aether_workspace', {
        datasets, headers, types, schema, filename, ingestedAt,
        stage, userPath, appliedOps: Array.from(appliedOps),
        rawRows, cleanedRows, quarantinedRows
      });
    }
  }, [datasets, rawRows, cleanedRows, quarantinedRows, stage, appliedOps]);

  async function loadWorkspace() {
    const data: any = await localforage.getItem('aether_workspace');
    if (!data) return;
    if (data.datasets) setDatasets(data.datasets);
    setHeaders(data.headers);
    setTypes(data.types);
    setSchema(data.schema);
    setFilename(data.filename);
    setIngestedAt(data.ingestedAt);
    setStage(data.stage);
    if (data.userPath) setUserPath(data.userPath);
    setAppliedOps(new Set(data.appliedOps));
    setRawRows(data.rawRows);
    setCleanedRows(data.cleanedRows);
    if (data.quarantinedRows) setQuarantinedRows(data.quarantinedRows);
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
      rawRows, cleanedRows, quarantinedRows
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

  const exportProject = () => {
    const pipeline_state = JSON.stringify({
      headers, types, schema, filename, ingestedAt,
      stage, appliedOps: Array.from(appliedOps),
      rawRows, cleanedRows, quarantinedRows
    });
    const blob = new Blob([pipeline_state], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename || 'aether_project'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Project exported successfully!', 'success');
  };

  const importProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.headers) setHeaders(data.headers);
        if (data.types) setTypes(data.types);
        if (data.schema) setSchema(data.schema);
        if (data.filename) setFilename(data.filename);
        if (data.ingestedAt) setIngestedAt(data.ingestedAt);
        if (data.stage) setStage(data.stage);
        if (data.appliedOps) setAppliedOps(new Set(data.appliedOps));
        if (data.rawRows) setRawRows(data.rawRows);
        if (data.cleanedRows) setCleanedRows(data.cleanedRows);
        if (data.quarantinedRows) setQuarantinedRows(data.quarantinedRows);
        setShowHero(false);
        showToast('Project imported successfully!', 'success');
      } catch (err) {
        showToast('Failed to parse project file', 'error');
      }
    };
    reader.readAsText(file);
  };

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
  
  const router = useRouter(); // add router

  const handleIngest = useCallback(async (hdrs: string[], rawIncomingRows: DataRow[], fname: string, type: 'csv'|'api'|'pdf'|'db' = 'csv', streaming: boolean = false) => {
    // 🧠 Intelligent Feature: Smart Cast currencies/percentages
    const rows = smartCastData(rawIncomingRows, hdrs);

    const dsId = Math.random().toString(36).substr(2, 9);
    
    // Infer types and schema before saving!
    const t = inferTypes(hdrs, rows);
    const sch = hdrs.map(h => {
      const p = profileColumn(h, t[h], rows);
      return { name: h, type: t[h], nullCount: p.nulls, uniqueCount: p.unique ?? rows.length };
    });
    
    const { cleanRows, quarantinedRows: badRows } = splitQuarantine(hdrs, rows);

    const ds = { 
      id: dsId, 
      name: fname, 
      headers: hdrs, 
      rows: cleanRows, 
      types: t,
      schema: sch,
      appliedOps: [],
      sourceType: type, 
      ingestedAt: new Date() 
    };
    
    // Save to the new backend DB so the WorkspaceContext can pick it up!
    try {
      await fetch('/api/datasets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ds)
      });
    } catch (e) {
      console.error('Failed to save to backend DB', e);
    }

    setDatasets(prev => {
      const next = [...prev, ds];
      
      if (next.length === 1) {
        setHeaders(hdrs);
        setTypes(t);
        setSchema(sch);
        setFilename(fname);
        setIngestedAt(new Date());

        if (streaming) {
          // Initialize empty and start stream
          setRawRows([]);
          setCleanedRows([]);
          setQuarantinedRows([]);
          setStreamQueue(rows);
          setIsStreaming(true);
          setStage('dashboard'); // Jump to dashboard to watch live
          setUserPath('bi'); // Default to BI path to see dashboard
        } else {
          const { cleanRows, quarantinedRows: badRows } = splitQuarantine(hdrs, rows);
          setRawRows(cleanRows);
          setCleanedRows(JSON.parse(JSON.stringify(cleanRows)));
          setQuarantinedRows(badRows);
          if (badRows.length > 0) {
            showToast(`Quarantined ${badRows.length} corrupted rows`, 'error');
          }
        }
      }
      return next;
    });

    setLogs(prev => [
      ...prev,
      `» Loaded [${type.toUpperCase()}] ${fname} (${rows.length} rows, ${hdrs.length} cols)${streaming ? ' [STREAMING]' : ''}`
    ]);
    setShowHero(false);
    showToast(`✓ Loaded ${fname}`, 'success');

    if (datasets.length === 0) {
      if (streaming) {
        router.push(`/workspace/${dsId}/bi`);
      } else {
        router.push(`/workspace/${dsId}/de`);
      }
    }
  }, [datasets, router]);


  // ── Clean Ops ────────────────────────────────────────────────────────────────
  const [rowHistory, setRowHistory] = useState<{rows: DataRow[], ops: Set<string>}[]>([]);

  function pushHistory() {
    setRowHistory(prev => [...prev, { rows: [...cleanedRows], ops: new Set(appliedOps) }]);
  }

  function handleTimeTravel(index: number) {
    if (index >= rowHistory.length) return;
    const h = rowHistory[index];
    setCleanedRows(h.rows);
    setAppliedOps(h.ops);
    setRowHistory(prev => prev.slice(0, index));
    showToast('⏪ Time travel successful!', 'success');
  }

  function handleApplyOp(id: string) {
    if (appliedOps.has(id)) return;
    pushHistory();
    setCleanedRows(prev => applyCleanOp(id, prev, headers, types));
    setAppliedOps(prev => new Set([...prev, id]));
    showToast(`✓ Applied: ${id.replace(/_/g, ' ')}`, 'success');
  }

  function handleApplyAll() {
    pushHistory();
    let rows = [...cleanedRows];
    let currentHeaders = [...headers];
    
    // Context-Aware Auto-Clean logic:
    // 1. Drop columns with > 50% nulls
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
      showToast(`Dropped ${colsToDrop.length} highly sparse columns: ${colsToDrop.join(', ')}`, 'info');
    }

    const newOps = new Set(appliedOps);
    CLEANING_ALL.forEach(id => {
      if (!newOps.has(id)) { rows = applyCleanOp(id, rows, currentHeaders, types); newOps.add(id); }
    });
    setCleanedRows(rows);
    setAppliedOps(newOps);
    showToast('✅ Context-Aware Auto-Clean complete!', 'success');
  }

  // ── Advanced Clean ────────────────────────────────────────────────────────────
  function handleFindReplace(col: string, find: string, replace: string) {
    pushHistory();
    setCleanedRows(prev => findReplace(col, find, replace, prev));
    showToast(`✓ Replaced "${find}" → "${replace}" in ${col}`, 'success');
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
    <>

      {/* Topbar */}
      <header className="topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '64px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div className="logo-wrap" style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div className="logo-icon" style={{ background: 'linear-gradient(135deg, var(--accent), var(--violet))', borderRadius: '8px', boxShadow: '0 2px 10px rgba(99,102,241,0.4)', padding: '4px' }}>
            <Rocket size={18} color="#fff" />
          </div>
          <span className="logo-text" style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #fff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Aether</span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
            {headers.length > 0 && (
              <span className="data-badge" style={{ padding: '4px 10px', borderRadius: '16px', background: 'var(--bg-body)', border: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {rawRows.length}R • {headers.length}C
              </span>
            )}
            <span className="version-badge" style={{ padding: '4px 10px', borderRadius: '16px', background: 'rgba(128,90,213,0.1)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(128,90,213,0.2)' }}>
              MVP v1.0
            </span>
          </div>
        </div>
        
        {(!showHero || rawRows.length > 0) && (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.5, display: 'flex' }}>
                <Search size={16} />
              </span>
              <input 
                type="text" 
                placeholder="Search workspaces, data, AI..." 
                className="search-input" 
                style={{ width: '100%', padding: '10px 16px 10px 42px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '24px', fontSize: '0.9rem', outline: 'none', transition: 'all 0.3s' }}
              />
            </div>
          </div>
        )}

        <div className="topbar-right" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-sm btn-secondary" onClick={() => document.getElementById('import-file')?.click()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FolderOpen size={14} /> Import Project
            </button>
            <input id="import-file" type="file" accept=".json" onChange={importProject} style={{ display: 'none' }} />
            
            {rawRows.length > 0 && (
              <button className="btn btn-sm btn-secondary" onClick={exportProject} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Save size={14} /> Export Project
              </button>
            )}
          </div>
          {rawRows.length > 0 && user && (
            <button className="btn btn-sm btn-primary" onClick={saveToCloud} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              Cloud Save
            </button>
          )}
          {user ? (
            <button style={{ background: 'var(--emerald)', color: '#fff', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: '16px', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setUser(null)}>
              <UserIcon size={14} /> {user.email.split('@')[0]}
            </button>
          ) : (
            <button className="btn btn-sm btn-primary" onClick={() => setShowAuthModal(true)} style={{ padding: '8px 16px', borderRadius: '20px', fontWeight: 600 }}>Sign In</button>
          )}
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
        <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
          {/* Global Sidebar Navigation */}
          <aside className="global-sidebar" style={{ width: '240px', background: 'transparent', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
            <div className="sidebar-module-title" style={{ padding: '0 24px', marginBottom: '16px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>Modules</div>
            
            {/* Dynamically filter sidebar modules based on recommendations */}
            {(() => {
              const understanding = datasets.length > 0 ? require('@/lib/dataUnderstanding').analyzeDataset(headers, cleanedRows) : null;
              const recs: import('@/lib/types').AetherRecommendation[] = understanding?.recommendations || [];
              const hasDashboard = !understanding || recs.some(r => r.category === 'dashboard');
              const hasML = !understanding || recs.some(r => r.category === 'prediction' && r.id !== 'no_prediction');

              return (
                <>
                  <button className={stage === 'ingest' ? 'active' : ''} onClick={() => setStage('ingest')} style={{ background: stage === 'ingest' ? 'rgba(255,255,255,0.05)' : 'transparent', color: stage === 'ingest' ? 'var(--text-primary)' : 'var(--text-secondary)', border: 'none', padding: '12px 24px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', fontSize: '14px', fontWeight: 600, borderLeft: stage === 'ingest' ? '3px solid var(--cyan)' : '3px solid transparent', transition: 'all 0.2s' }}>
                    <Inbox size={18} color={stage === 'ingest' ? 'var(--cyan)' : 'currentColor'} /> Ingestion
                  </button>
                  <button className={stage === 'discovery' ? 'active' : ''} onClick={() => setStage('discovery')} disabled={rawRows.length === 0} style={{ background: stage === 'discovery' ? 'rgba(255,255,255,0.05)' : 'transparent', color: stage === 'discovery' ? 'var(--text-primary)' : 'var(--text-secondary)', border: 'none', padding: '12px 24px', textAlign: 'left', cursor: rawRows.length === 0 ? 'not-allowed' : 'pointer', opacity: rawRows.length === 0 ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: '14px', fontSize: '14px', fontWeight: 600, borderLeft: stage === 'discovery' ? '3px solid var(--cyan)' : '3px solid transparent', transition: 'all 0.2s' }}>
                    <Search size={18} color={stage === 'discovery' ? 'var(--cyan)' : 'currentColor'} /> Data Discovery
                  </button>
                  <button className={stage === 'clean' ? 'active' : ''} onClick={() => setStage('clean')} disabled={rawRows.length === 0} style={{ background: stage === 'clean' ? 'rgba(255,255,255,0.05)' : 'transparent', color: stage === 'clean' ? 'var(--text-primary)' : 'var(--text-secondary)', border: 'none', padding: '12px 24px', textAlign: 'left', cursor: rawRows.length === 0 ? 'not-allowed' : 'pointer', opacity: rawRows.length === 0 ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: '14px', fontSize: '14px', fontWeight: 600, borderLeft: stage === 'clean' ? '3px solid var(--cyan)' : '3px solid transparent', transition: 'all 0.2s' }}>
                    <Hammer size={18} color={stage === 'clean' ? 'var(--cyan)' : 'currentColor'} /> Data Quality
                  </button>
                  <button className={stage === 'analyze' ? 'active' : ''} onClick={() => setStage('analyze')} disabled={rawRows.length === 0} style={{ background: stage === 'analyze' ? 'rgba(255,255,255,0.05)' : 'transparent', color: stage === 'analyze' ? 'var(--text-primary)' : 'var(--text-secondary)', border: 'none', padding: '12px 24px', textAlign: 'left', cursor: rawRows.length === 0 ? 'not-allowed' : 'pointer', opacity: rawRows.length === 0 ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: '14px', fontSize: '14px', fontWeight: 600, borderLeft: stage === 'analyze' ? '3px solid var(--cyan)' : '3px solid transparent', transition: 'all 0.2s' }}>
                    <BarChart3 size={18} color={stage === 'analyze' ? 'var(--cyan)' : 'currentColor'} /> Data Analyst
                  </button>
                  
                  {hasDashboard && (
                    <button className={stage === 'dashboard' ? 'active' : ''} onClick={() => setStage('dashboard')} disabled={rawRows.length === 0} style={{ background: stage === 'dashboard' ? 'rgba(255,255,255,0.05)' : 'transparent', color: stage === 'dashboard' ? 'var(--text-primary)' : 'var(--text-secondary)', border: 'none', padding: '12px 24px', textAlign: 'left', cursor: rawRows.length === 0 ? 'not-allowed' : 'pointer', opacity: rawRows.length === 0 ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: '14px', fontSize: '14px', fontWeight: 600, borderLeft: stage === 'dashboard' ? '3px solid var(--cyan)' : '3px solid transparent', transition: 'all 0.2s' }}>
                      <Presentation size={18} color={stage === 'dashboard' ? 'var(--cyan)' : 'currentColor'} /> Business Intel
                    </button>
                  )}
                  
                  {hasML && (
                    <button className={stage === 'deploy' ? 'active' : ''} onClick={() => setStage('deploy')} disabled={rawRows.length === 0} style={{ background: stage === 'deploy' ? 'rgba(255,255,255,0.05)' : 'transparent', color: stage === 'deploy' ? 'var(--text-primary)' : 'var(--text-secondary)', border: 'none', padding: '12px 24px', textAlign: 'left', cursor: rawRows.length === 0 ? 'not-allowed' : 'pointer', opacity: rawRows.length === 0 ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: '14px', fontSize: '14px', fontWeight: 600, borderLeft: stage === 'deploy' ? '3px solid var(--cyan)' : '3px solid transparent', transition: 'all 0.2s' }}>
                      <Rocket size={18} color={stage === 'deploy' ? 'var(--cyan)' : 'currentColor'} /> ML Deploy
                    </button>
                  )}
                </>
              );
            })()}
          </aside>

      <main className="main-content" style={{ flex: 1, overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ width: '100%', height: '100%' }}
          >
            {stage === 'ingest' && (
              <IngestStage
                onIngest={handleIngest}
                logs={logs}
                hasData={datasets.length > 0}
                datasets={datasets}
                onProceed={() => setStage('discovery')}
                onError={msg => showToast(msg, 'error')}
              />
            )}
            {stage === 'discovery' && (
              <DiscoveryStage
                headers={headers}
                rows={cleanedRows}
                filename={filename}
                ingestedAt={ingestedAt}
                quarantinedCount={quarantinedRows.length}
                sourceType={datasets[0]?.sourceType || 'csv'}
                onProceed={() => setStage('clean')}
                onNavigate={(tgt) => setStage(tgt as Stage)}
              />
            )}
            {stage === 'clean' && (
              <CleanStage 
                headers={headers} types={types} rawRows={rawRows} cleanedRows={cleanedRows} 
                quarantinedRows={quarantinedRows}
                onAddDataset={() => setStage('ingest')}
                previousRows={rowHistory.length > 0 ? rowHistory[rowHistory.length - 1].rows : rawRows}
                issues={issues} appliedOps={appliedOps} onApplyOp={handleApplyOp} onApplyAll={handleApplyAll} 
                onFindReplace={handleFindReplace} onDropColumn={handleDropColumn} onProceed={() => setStage('analyze')} 
                rowHistoryLength={rowHistory.length} onTimeTravel={handleTimeTravel}
                onRestoreQuarantine={() => {
                  setRawRows(prev => [...prev, ...quarantinedRows]);
                  setCleanedRows(prev => [...prev, ...quarantinedRows]);
                  setQuarantinedRows([]);
                  showToast('Restored corrupted rows to main dataset', 'success');
                }}
                onDropQuarantine={() => {
                  setQuarantinedRows([]);
                  showToast('Quarantined rows deleted forever', 'success');
                }}
                onConsolidateCategories={(col) => {
                  import('@/lib/dataUtils').then(({ consolidateCategories }) => {
                     pushHistory();
                     setCleanedRows(prev => consolidateCategories(prev, col, 2));
                     showToast(`Consolidated fuzzy typos in ${col}`, 'success');
                  });
                }}
              />
            )}
            {stage === 'ethics' && (
              <EthicsStage
                headers={headers}
                types={types}
                rows={cleanedRows}
                onProceed={() => setStage('analyze')}
              />
            )}
            {stage === 'analyze' && (
              <AnalyzeStage
                headers={headers}
                types={types}
                rows={cleanedRows}
                onProceed={() => setStage('dashboard')}
                onUpdateRows={handleUpdateRows}
                onError={(msg) => showToast(msg, 'error')}
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
                appliedOps={Array.from(appliedOps)}
                ingestedAt={ingestedAt ? ingestedAt.toISOString() : null}
              />
            )}
            {stage === 'model' && (
              <ModelStage
                headers={headers}
                types={types}
                rows={cleanedRows}
                onProceed={() => setStage('evaluate')}
              />
            )}
            {stage === 'evaluate' && (
              <EvaluateStage
                headers={headers}
                types={types}
                rows={cleanedRows}
                onProceed={() => setStage('deploy')}
              />
            )}
            {stage === 'orchestrate' && (
              <OrchestrateStage 
                headers={headers}
                filename={filename}
                onProceed={() => setStage('monitor')} 
              />
            )}
            {stage === 'monitor' && (
              <MonitorStage 
                headers={headers}
                types={types}
                rows={cleanedRows.length ? cleanedRows : rawRows}
                onProceed={() => setStage('deploy')} 
              />
            )}
            {stage === 'deploy' && (
              <DeployStage
                headers={headers}
                types={types}
                rows={cleanedRows.length ? cleanedRows : rawRows}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      </div>
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
      {/* AI Assistant Panel */}
      <AIAssistant currentStage={stage} rowCount={cleanedRows.length || rawRows.length} />

    </>
  );
}
