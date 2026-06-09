'use client';

import { useState, useMemo, useEffect } from 'react';
import { DataRow, DataSchema } from '@/lib/types';
import { exportCSV, isPII } from '@/lib/dataUtils';
import { getDb, loadDataToTable, executeQuery } from '@/lib/duckdbUtils';
import { motion, AnimatePresence } from 'framer-motion';

const PAGE_SIZE = 20;

interface StoreStageProps {
  datasets: import('@/lib/types').IngestedDataset[];
  headers: string[];
  schema: DataSchema[];
  rows: DataRow[];
  filename: string;
  ingestedAt: Date | null;
  onProceed: () => void;
  onUpdateRows: (newHeaders: string[], newRows: DataRow[]) => void;
}

type SortDir = 'asc' | 'desc' | null;

export default function StoreStage({ datasets, headers, schema, rows, filename, ingestedAt, onProceed, onUpdateRows }: StoreStageProps) {
  const [dbReady, setDbReady] = useState(false);
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM t1;');
  const [isExecuting, setIsExecuting] = useState(false);
  const [sqlError, setSqlError] = useState('');
  const [mergeMode, setMergeMode] = useState<'visual' | 'sql'>('visual');
  const [joinType, setJoinType] = useState('JOIN');
  const [tableA, setTableA] = useState('t1');
  const [tableB, setTableB] = useState('t2');
  const [colA, setColA] = useState('');
  const [colB, setColB] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const db = await getDb();
        // Load all datasets into DuckDB
        for (let i = 0; i < datasets.length; i++) {
          await loadDataToTable(db, `t${i+1}`, datasets[i].rows);
        }
        setDbReady(true);
        if (datasets.length > 1) {
          setSqlQuery(`SELECT *\nFROM t1\nJOIN t2 ON t1.id = t2.id;`);
        }
      } catch (err: any) {
        console.error(err);
      }
    }
    if (datasets.length > 0) init();
  }, [datasets]);

  // Try to find common columns for auto-join
  useEffect(() => {
    if (datasets.length < 2) return;
    const dsA = datasets[parseInt(tableA.replace('t','')) - 1];
    const dsB = datasets[parseInt(tableB.replace('t','')) - 1];
    if (dsA && dsB) {
      if (!colA) setColA(dsA.headers[0]);
      if (!colB) setColB(dsB.headers[0]);
    }
  }, [tableA, tableB, datasets, colA, colB]);

  async function handleRunSQL() {
    let finalQuery = sqlQuery;
    if (mergeMode === 'visual') {
      if (joinType === 'UNION ALL') {
        finalQuery = `SELECT * FROM ${tableA} UNION ALL SELECT * FROM ${tableB};`;
      } else {
        finalQuery = `SELECT * FROM ${tableA} ${joinType} ${tableB} ON ${tableA}.${colA} = ${tableB}.${colB};`;
      }
      setSqlQuery(finalQuery); // Sync it to the text area
    }
    if (!dbReady) return;
    setIsExecuting(true);
    setSqlError('');
    try {
      const db = await getDb();
      const results = await executeQuery(db, sqlQuery);
      if (results.length > 0) {
        onUpdateRows(Object.keys(results[0]), results);
      }
    } catch (err: any) {
      setSqlError(err.message);
    } finally {
      setIsExecuting(false);
    }
  }

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());

  const visibleHeaders = headers.filter(h => !hiddenCols.has(h));
  
  const piiCols = useMemo(() => {
    const set = new Set<string>();
    headers.forEach(h => {
      if (isPII(h, rows.map(r => r[h]))) set.add(h);
    });
    return set;
  }, [headers, rows]);

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(r => Object.values(r).some(v => String(v ?? '').toLowerCase().includes(q)));
  }, [rows, search]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortCol || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const va = a[sortCol], vb = b[sortCol];
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      const cmp = typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir]);

  const slice = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSort(col: string) {
    if (sortCol !== col) { setSortCol(col); setSortDir('asc'); }
    else if (sortDir === 'asc') setSortDir('desc');
    else { setSortCol(null); setSortDir(null); }
    setPage(0);
  }

  function toggleCol(col: string) {
    setHiddenCols(prev => {
      const next = new Set(prev);
      next.has(col) ? next.delete(col) : next.add(col);
      return next;
    });
  }

  const numCols  = schema.filter(s => s.type === 'number').length;
  const nullTotal = rows.reduce((a, r) => a + headers.filter(h => r[h] === null || r[h] === undefined || r[h] === '').length, 0);
  const completeness = (((rows.length * headers.length - nullTotal) / (rows.length * headers.length)) * 100).toFixed(1);
  const bytes = JSON.stringify(rows).length;

  const TYPE_COLOR: Record<string, string> = { string: 'violet', number: 'cyan', boolean: 'green', date: 'amber' };
  const TYPE_ICON:  Record<string, string> = { string: 'A', number: '#', boolean: '◉', date: '📅' };

  const sortIcon = (col: string) => {
    if (sortCol !== col) return <span style={{ opacity: 0.3, marginLeft: 4 }}>⇅</span>;
    return <span style={{ marginLeft: 4, color: 'var(--cyan)' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="stage-content"
    >
      {datasets.length > 1 && (
        <motion.div variants={itemVariants} className="card" style={{ marginBottom: 20 }}>
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <div className="card-label" style={{ margin: 0 }}>Combine Multiple Datasets</div>
            {!dbReady ? <span style={{color: 'var(--amber)'}}>⏳ Loading tables...</span> : <span style={{color: 'var(--emerald)'}}>✅ Tables Ready: {datasets.map((d,i) => `t${i+1}`).join(', ')}</span>}
          </div>
          <p style={{fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16}}>
            You have loaded {datasets.length} datasets. Use DuckDB SQL to JOIN or UNION them into a single primary table before continuing.
          </p>
          <textarea
            className="paste-area"
            style={{ fontFamily: 'monospace', height: '80px', fontSize: '14px', background: 'rgba(0,0,0,0.2)', color: 'var(--cyan)', borderColor: 'rgba(255,255,255,0.1)', width: '100%' }}
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            disabled={!dbReady || isExecuting}
          />
          {sqlError && <div style={{ color: 'var(--rose)', fontSize: 13, marginTop: 8 }}>{sqlError}</div>}
          <div className="flex gap-8" style={{ marginTop: 12 }}>
            <button className="btn btn-secondary" onClick={handleRunSQL} disabled={!dbReady || isExecuting} style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--cyan)' }}>
              {isExecuting ? '⏳ Executing...' : '▶ Execute & Update Table'}
            </button>
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="stage-header flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="stage-title" style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            <span style={{ marginRight: '12px' }}>🗄</span> Data Store
          </h1>
          <p className="stage-sub" style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '16px' }}>In-memory warehouse — explore, search, filter, sort, and export your data.</p>
        </div>
        <div className="flex gap-8">
          <button className="btn btn-secondary" onClick={() => exportCSV(headers, rows, filename.replace(/\.[^.]+$/, '_export.csv'))}>⬇ Export CSV</button>
          <button className="btn btn-primary" onClick={onProceed} style={{ background: 'linear-gradient(135deg, var(--cyan), var(--violet))', border: 'none', color: '#fff', boxShadow: '0 0 20px rgba(6,182,212,0.4)' }}>Clean Data →</button>
        </div>
      </motion.div>

      {/* KPI row */}
      <motion.div variants={itemVariants} className="stat-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { val: rows.length, lbl: 'Total Rows',    color: 'var(--cyan)' },
          { val: headers.length, lbl: 'Columns',    color: 'var(--violet)' },
          { val: numCols, lbl: 'Numeric Cols',      color: 'var(--emerald)' },
          { val: completeness + '%', lbl: 'Completeness', color: 'var(--amber)' },
        ].map(s => (
          <motion.div whileHover={{ y: -2 }} key={s.lbl} className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: `radial-gradient(circle, ${s.color}20 0%, transparent 70%)`, transform: 'translate(30%, -30%)' }} />
            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', marginBottom: '12px', textTransform: 'uppercase' }}>{s.lbl}</div>
            <div style={{ fontSize: '36px', fontWeight: 800, color: s.color, fontFamily: 'JetBrains Mono' }}>{s.val}</div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Schema */}
        <div className="card">
          <div className="card-label">Schema Detection</div>
          <div className="schema-pills">
            {schema.map(col => (
              <span key={col.name} className={`schema-pill type-${TYPE_COLOR[col.type]}`}>
                <span>{TYPE_ICON[col.type]}</span> {col.name}
                <span style={{ color: 'var(--text-muted)', marginLeft: 2, fontSize: 9 }}>({col.nullCount} nulls)</span>
              </span>
            ))}
          </div>
        </div>

        {/* Metadata */}
        <div className="card">
          <div className="card-label">Storage Metadata</div>
          {[
            ['Engine', 'In-Memory JS Store'],
            ['File', filename],
            ['Format', 'Structured JSON'],
            ['Size', `~${(bytes / 1024).toFixed(1)} KB`],
            ['Null Values', nullTotal],
            ['Unique Rows', new Set(rows.map(r => JSON.stringify(r))).size],
            ['Ingested', ingestedAt?.toLocaleString() ?? '—'],
          ].map(([k, v]) => (
            <div key={String(k)} className="meta-row">
              <span className="meta-key">{k}</span>
              <span className="meta-val">{v}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Data table with search + column toggle */}
      <motion.div variants={itemVariants} className="card" style={{ marginTop: 20 }}>
        <div className="flex-between" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div className="card-label" style={{ margin: 0 }}>Data Preview</div>
          <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
            <input
              className="search-input"
              placeholder="🔍 Search all columns..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
            />
            <span className="meta-key" style={{ alignSelf: 'center', whiteSpace: 'nowrap' }}>
              {sorted.length} / {rows.length} rows
            </span>
          </div>
        </div>

        {/* Column toggles */}
        <div className="col-toggles">
          {headers.map(h => (
            <button
              key={h}
              className={`col-toggle-btn ${hiddenCols.has(h) ? 'hidden' : 'visible'}`}
              onClick={() => toggleCol(h)}
              title={hiddenCols.has(h) ? 'Show column' : 'Hide column'}
            >
              {hiddenCols.has(h) ? '○' : '●'} {h}
            </button>
          ))}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {visibleHeaders.map(h => (
                  <th key={h} onClick={() => handleSort(h)} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    {h} {sortIcon(h)}
                    {piiCols.has(h) && <span style={{ marginLeft: '8px', fontSize: '10px', background: 'var(--amber)', color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>[SECURE]</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.map((row, i) => (
                <motion.tr 
                  key={i} 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ duration: 0.2, delay: i * 0.02 }}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                >
                  {visibleHeaders.map(h => {
                    const val = row[h];
                    let displayVal = val;
                    if (piiCols.has(h) && typeof val === 'string' && val.trim() !== '') {
                      if (val.includes('@')) {
                        const [user, domain] = val.split('@');
                        displayVal = `${user[0]}***@${domain}`;
                      } else {
                        displayVal = '***-***-****';
                      }
                    }
                    const isNull = displayVal === null || displayVal === undefined || displayVal === '';
                    return (
                      <td key={h}>
                        {isNull ? (
                          <span style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', borderRadius: '12px', fontSize: '11px' }}>null</span>
                        ) : (
                          <span style={{ color: 'var(--text-primary)' }}>{String(displayVal)}</span>
                        )}
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
              {slice.length === 0 && (
                <tr><td colSpan={visibleHeaders.length} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No rows match your search</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <button className="btn btn-secondary btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="meta-key" style={{ alignSelf: 'center' }}>Page {page + 1} of {Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))}</span>
          <button className="btn btn-secondary btn-sm" disabled={(page + 1) * PAGE_SIZE >= sorted.length} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
