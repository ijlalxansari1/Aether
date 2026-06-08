'use client';

import { useState, useMemo } from 'react';
import { DataRow, DataSchema } from '@/lib/types';
import { exportCSV } from '@/lib/dataUtils';

const PAGE_SIZE = 20;

interface StoreStageProps {
  headers: string[];
  schema: DataSchema[];
  rows: DataRow[];
  filename: string;
  ingestedAt: Date | null;
  onProceed: () => void;
}

type SortDir = 'asc' | 'desc' | null;

export default function StoreStage({ headers, schema, rows, filename, ingestedAt, onProceed }: StoreStageProps) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());

  const visibleHeaders = headers.filter(h => !hiddenCols.has(h));

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

  return (
    <div className="stage-content">
      <div className="stage-header flex-between">
        <div>
          <h1 className="stage-title"><span>🗄</span> Data Store</h1>
          <p className="stage-sub">In-memory warehouse — explore, search, filter, sort, and export your data.</p>
        </div>
        <div className="flex gap-8">
          <button className="btn btn-secondary" onClick={() => exportCSV(headers, rows, filename.replace(/\.[^.]+$/, '_export.csv'))}>⬇ Export CSV</button>
          <button className="btn btn-primary" onClick={onProceed}>Clean Data →</button>
        </div>
      </div>

      {/* KPI row */}
      <div className="stat-row">
        {[
          { val: rows.length, lbl: 'Total Rows',    color: 'var(--cyan)' },
          { val: headers.length, lbl: 'Columns',    color: 'var(--violet)' },
          { val: numCols, lbl: 'Numeric Cols',      color: 'var(--emerald)' },
          { val: completeness + '%', lbl: 'Completeness', color: 'var(--amber)' },
        ].map(s => (
          <div key={s.lbl} className="stat-box">
            <div className="stat-val" style={{ color: s.color }}>{s.val}</div>
            <div className="stat-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      <div className="two-col">
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
      </div>

      {/* Data table with search + column toggle */}
      <div className="card" style={{ marginTop: 20 }}>
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
                    {h}{sortIcon(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.map((row, i) => (
                <tr key={i}>
                  {visibleHeaders.map(h => {
                    const v = row[h];
                    const isNull = v === null || v === undefined || v === '';
                    return <td key={h} className={isNull ? 'null-cell' : ''}>{isNull ? 'null' : String(v)}</td>;
                  })}
                </tr>
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
      </div>
    </div>
  );
}
