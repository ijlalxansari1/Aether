'use client';

import { useState } from 'react';
import { DataRow, QualityIssue, ColumnType } from '@/lib/types';
import { calcDQScore, findReplace } from '@/lib/dataUtils';

const CLEANING_OPS: { id: string; icon: string; title: string; desc: string }[] = [
  { id: 'remove_dups',  icon: '♻️', title: 'Remove Duplicates',   desc: 'Drop exact duplicate rows' },
  { id: 'fill_nulls',   icon: '🔧', title: 'Fill Null Values',    desc: 'Numeric→median, String→"Unknown"' },
  { id: 'cap_outliers', icon: '📐', title: 'Cap Outliers',         desc: 'Winsorize at 1.5× IQR' },
  { id: 'trim_spaces',  icon: '✂️', title: 'Trim Whitespace',      desc: 'Strip leading/trailing spaces' },
  { id: 'normalize',    icon: '⚖️', title: 'Normalize Numerics',   desc: 'Scale numbers to [0,1]' },
  { id: 'fix_types',    icon: '🔄', title: 'Fix Data Types',       desc: 'Re-cast columns to correct types' },
];

interface CleanStageProps {
  headers: string[];
  types: Record<string, ColumnType>;
  rawRows: DataRow[];
  cleanedRows: DataRow[];
  issues: QualityIssue[];
  appliedOps: Set<string>;
  onApplyOp: (id: string) => void;
  onApplyAll: () => void;
  onFindReplace: (col: string, find: string, replace: string) => void;
  onDropColumn: (col: string) => void;
  onProceed: () => void;
}

export default function CleanStage({
  headers, types, rawRows, cleanedRows, issues, appliedOps, onApplyOp, onApplyAll, onFindReplace, onDropColumn, onProceed
}: CleanStageProps) {
  const [findCol, setFindCol] = useState(headers[0] ?? '');
  const [findVal, setFindVal] = useState('');
  const [replaceVal, setReplaceVal] = useState('');
  const [dropConfirm, setDropConfirm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ops' | 'advanced'>('ops');

  const dqScore = calcDQScore(cleanedRows, headers, appliedOps.size);
  const dqColor = dqScore >= 80 ? 'var(--emerald)' : dqScore >= 60 ? 'var(--amber)' : 'var(--rose)';
  const nullAfter = cleanedRows.reduce((a, r) => a + headers.filter(h => r[h] === null || r[h] === undefined || r[h] === '').length, 0);
  const SEVER_COLOR: Record<string, string> = { high: 'rose', medium: 'amber', low: 'cyan' };

  const strCols = headers.filter(h => types[h] === 'string');

  return (
    <div className="stage-content">
      <div className="stage-header flex-between">
        <div>
          <h1 className="stage-title"><span>🧹</span> Data Cleaning & Preprocessing</h1>
          <p className="stage-sub">Detect and resolve nulls, duplicates, outliers — plus advanced find/replace and column management.</p>
        </div>
        <button className="btn btn-primary" onClick={onProceed}>Analyze Data →</button>
      </div>

      <div className="two-col">
        {/* Left — issues + completeness */}
        <div className="col-stack">
          <div className="card">
            <div className="card-label">Quality Issues Detected</div>
            {issues.length === 0
              ? <div style={{ color: 'var(--emerald)', padding: '12px 0' }}>✅ No issues found!</div>
              : issues.map((iss, i) => (
                <div key={i} className={`issue-row sev-${SEVER_COLOR[iss.severity]}`}>
                  <div className="issue-info">
                    <span className="issue-icon">
                      {iss.type === 'null' ? '⚠️' : iss.type === 'duplicate' ? '♻️' : '📉'}
                    </span>
                    <div>
                      <div className="issue-title">
                        {iss.type === 'null' ? `Missing values in "${iss.column}"` :
                         iss.type === 'duplicate' ? 'Duplicate rows detected' :
                         `Outliers in "${iss.column}"`}
                      </div>
                      <div className="issue-detail">
                        {iss.count} {iss.type === 'null' ? 'null values' : iss.type === 'duplicate' ? 'duplicates' : 'outliers'}
                        {' · '}Severity:{' '}
                        <span style={{ color: `var(--${iss.severity === 'high' ? 'rose' : iss.severity === 'medium' ? 'amber' : 'cyan'})` }}>{iss.severity}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`badge badge-${SEVER_COLOR[iss.severity]}`}>{iss.severity}</span>
                </div>
              ))
            }
          </div>

          <div className="card">
            <div className="card-label">Column Completeness</div>
            {headers.map(h => {
              const nonNull = cleanedRows.filter(r => r[h] !== null && r[h] !== undefined && r[h] !== '').length;
              const pct = cleanedRows.length ? Math.round((nonNull / cleanedRows.length) * 100) : 100;
              const barColor = pct > 90 ? 'var(--emerald)' : pct > 70 ? 'var(--amber)' : 'var(--rose)';
              return (
                <div key={h} className="completeness-row">
                  <span className="comp-label">{h}</span>
                  <div className="comp-bar-bg">
                    <div className="comp-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                  <span className="comp-pct" style={{ color: barColor }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right — ops + advanced */}
        <div className="col-stack">
          <div className="card">
            {/* Tabs */}
            <div className="flex gap-8" style={{ marginBottom: 16 }}>
              <button className={`chart-tab ${activeTab === 'ops' ? 'active' : ''}`} onClick={() => setActiveTab('ops')}>Cleaning Ops</button>
              <button className={`chart-tab ${activeTab === 'advanced' ? 'active' : ''}`} onClick={() => setActiveTab('advanced')}>Advanced Tools</button>
            </div>

            {activeTab === 'ops' && (
              <>
                <div className="ops-grid">
                  {CLEANING_OPS.map(op => (
                    <div
                      key={op.id}
                      className={`op-card ${appliedOps.has(op.id) ? 'applied' : ''}`}
                      onClick={() => onApplyOp(op.id)}
                    >
                      <span className="op-icon">{op.icon}</span>
                      <div>
                        <div className="op-title">{op.title}</div>
                        <div className="op-desc">{op.desc}</div>
                      </div>
                      {appliedOps.has(op.id) && <span className="op-check">✓</span>}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16 }}>
                  <button className="btn btn-primary" onClick={onApplyAll}>⚡ Apply All Fixes</button>
                </div>
              </>
            )}

            {activeTab === 'advanced' && (
              <div className="advanced-tools">
                {/* Find & Replace */}
                <div className="adv-section">
                  <div className="adv-title">🔍 Find & Replace</div>
                  <div className="adv-row">
                    <label className="adv-label">Column</label>
                    <select className="adv-select" value={findCol} onChange={e => setFindCol(e.target.value)}>
                      {strCols.map(h => <option key={h} value={h}>{h}</option>)}
                      {strCols.length === 0 && <option value="">No string columns</option>}
                    </select>
                  </div>
                  <div className="adv-row">
                    <label className="adv-label">Find</label>
                    <input className="adv-input" placeholder="Search text..." value={findVal} onChange={e => setFindVal(e.target.value)} />
                  </div>
                  <div className="adv-row">
                    <label className="adv-label">Replace</label>
                    <input className="adv-input" placeholder="Replacement..." value={replaceVal} onChange={e => setReplaceVal(e.target.value)} />
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: 10 }}
                    disabled={!findVal || !findCol}
                    onClick={() => {
                      onFindReplace(findCol, findVal, replaceVal);
                      setFindVal(''); setReplaceVal('');
                    }}
                  >
                    Apply Replace
                  </button>
                </div>

                {/* Drop column */}
                <div className="adv-section" style={{ marginTop: 20 }}>
                  <div className="adv-title">🗑 Drop Column</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {headers.map(h => (
                      <div key={h} style={{ position: 'relative' }}>
                        {dropConfirm === h ? (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-danger btn-sm" style={{ fontSize: 11 }}
                              onClick={() => { onDropColumn(h); setDropConfirm(null); }}>
                              Drop &ldquo;{h}&rdquo;
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setDropConfirm(null)}>✕</button>
                          </div>
                        ) : (
                          <button className="col-drop-btn" onClick={() => setDropConfirm(h)}>
                            {h} <span style={{ opacity: 0.5 }}>✕</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Click a column to confirm dropping it from the dataset</div>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-label">After Cleaning</div>
            {[
              ['Rows', cleanedRows.length],
              ['Remaining nulls', nullAfter],
              ['Ops applied', `${appliedOps.size} / 6`],
              ['Unique rows', new Set(cleanedRows.map(r => JSON.stringify(r))).size],
              ['Raw rows', rawRows.length],
              ['Dropped rows', rawRows.length - cleanedRows.length],
            ].map(([k, v]) => (
              <div key={String(k)} className="meta-row">
                <span className="meta-key">{k}</span>
                <span className="meta-val">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DQ Score */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="flex-between">
          <div>
            <div className="card-label" style={{ margin: 0 }}>Overall Data Quality Score</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Composite: completeness (50%) + uniqueness (40%) + operations bonus (10%)
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
              <div className="dq-pill" style={{ background: `rgba(16,185,129,${dqScore/100})`, borderColor: 'var(--emerald)' }}>
                Completeness {(((cleanedRows.length * headers.length - nullAfter) / (cleanedRows.length * headers.length || 1)) * 100).toFixed(0)}%
              </div>
              <div className="dq-pill" style={{ background: 'var(--violet-dim)', borderColor: 'rgba(124,58,237,0.3)' }}>
                {appliedOps.size} / 6 ops done
              </div>
              <div className="dq-pill" style={{ background: 'var(--cyan-dim)', borderColor: 'rgba(0,212,255,0.3)' }}>
                {issues.length} issues detected
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: dqColor, lineHeight: 1 }}>
              {dqScore.toFixed(0)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>DQ Score</div>
          </div>
        </div>
      </div>
    </div>
  );
}
