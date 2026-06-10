'use client';

import { useState } from 'react';
import { DataRow, QualityIssue, ColumnType } from '@/lib/types';
import { calcDQScore, findReplace, calculateDataDiff } from '@/lib/dataUtils';
import { motion, AnimatePresence } from 'framer-motion';

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
  previousRows?: DataRow[];
  issues: QualityIssue[];
  appliedOps: Set<string>;
  onApplyOp: (id: string) => void;
  onApplyAll: () => void;
  onFindReplace: (col: string, find: string, replace: string) => void;
  onDropColumn: (col: string) => void;
  onCustomFormula?: (newCol: string, formula: string) => void;
  onDetectAnomalies?: () => void;
  filename?: string;
  onProceed: () => void;
  rowHistoryLength?: number;
  onTimeTravel?: (index: number) => void;
}

export default function CleanStage({
  headers, types, rawRows, cleanedRows, previousRows, issues, appliedOps, onApplyOp, onApplyAll, onFindReplace, onDropColumn, onProceed, rowHistoryLength = 0, onTimeTravel, onCustomFormula, onDetectAnomalies, filename
}: CleanStageProps) {
  const [findCol, setFindCol] = useState(headers[0] ?? '');
  const [findVal, setFindVal] = useState('');
  const [replaceVal, setReplaceVal] = useState('');
  const [dropConfirm, setDropConfirm] = useState<string | null>(null);
  const [formulaCol, setFormulaCol] = useState('');
  const [formulaText, setFormulaText] = useState('');
  const [activeTab, setActiveTab] = useState<'ops' | 'advanced'>('ops');
  const [showDiff, setShowDiff] = useState(false);

  const dqScore = calcDQScore(cleanedRows, headers, appliedOps.size);
  const dqColor = dqScore >= 80 ? 'var(--emerald)' : dqScore >= 60 ? 'var(--amber)' : 'var(--rose)';
  const nullAfter = cleanedRows.reduce((a, r) => a + headers.filter(h => r[h] === null || r[h] === undefined || r[h] === '').length, 0);
  const SEVER_COLOR: Record<string, string> = { high: 'rose', medium: 'amber', low: 'cyan' };

  const strCols = headers.filter(h => types[h] === 'string');

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
      <motion.div variants={itemVariants} className="stage-header flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="stage-title" style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            <span style={{ marginRight: '12px' }}>🧹</span> Data Cleaning
          </h1>
          <p className="stage-sub" style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '16px' }}>Detect and resolve nulls, duplicates, outliers — plus advanced find/replace and column management.</p>
        </div>
        <motion.button 
          className="btn btn-primary" 
          onClick={onProceed} 
          whileHover={{ color: '#fcd34d', scale: 1.02 }}
          style={{ 
            background: 'linear-gradient(135deg, var(--violet, #7c3aed), var(--accent, #6366f1))', 
            border: 'none', 
            color: '#fff', 
            boxShadow: '0 0 20px rgba(139,92,246,0.4)',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Analyze Data →
        </motion.button>
      </motion.div>

      <motion.div variants={itemVariants} className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Left — issues + completeness */}
        <div className="col-stack" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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

          <div className="card">
            <div className="card-label">Export</div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Translate your visual operations into a production-ready Python script.
            </p>
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', borderColor: 'var(--violet)', color: 'var(--violet)' }}
              onClick={async () => {
                const { generatePythonCode } = await import('@/lib/dataUtils');
                const code = generatePythonCode(Array.from(appliedOps), filename || 'dataset.csv');
                const blob = new Blob([code], { type: 'text/plain' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `clean_${filename || 'dataset'}.py`;
                a.click();
              }}
            >
              🐍 Eject to Python
            </button>
          </div>
        </div>

        {/* Right — ops + advanced */}
        <div className="col-stack" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            {/* Tabs */}
            <div className="flex gap-8" style={{ marginBottom: 16 }}>
              <button className={`chart-tab ${activeTab === 'ops' ? 'active' : ''}`} onClick={() => setActiveTab('ops')}>Cleaning Ops</button>
              <button className={`chart-tab ${activeTab === 'advanced' ? 'active' : ''}`} onClick={() => setActiveTab('advanced')}>Advanced Tools</button>
            </div>

            {activeTab === 'ops' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <div className="ops-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {CLEANING_OPS.map(op => (
                    <motion.div
                      whileHover={{ y: -2, borderColor: appliedOps.has(op.id) ? 'var(--emerald)' : 'var(--cyan)' }}
                      whileTap={{ scale: 0.98 }}
                      key={op.id}
                      className={`op-card ${appliedOps.has(op.id) ? 'applied' : ''}`}
                      onClick={() => onApplyOp(op.id)}
                      style={{ cursor: 'pointer', padding: '16px', background: appliedOps.has(op.id) ? 'rgba(16,185,129,0.1)' : 'var(--bg-card)', border: `1px solid ${appliedOps.has(op.id) ? 'var(--emerald)' : 'var(--border)'}`, borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'center', position: 'relative' }}
                    >
                      <span className="op-icon" style={{ fontSize: '24px' }}>{op.icon}</span>
                      <div>
                        <div className="op-title" style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{op.title}</div>
                        <div className="op-desc" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{op.desc}</div>
                      </div>
                      {appliedOps.has(op.id) && <span className="op-check" style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--emerald)' }}>✓</span>}
                    </motion.div>
                  ))}
                </div>
                <div style={{ marginTop: 24 }}>
                  <button className="btn btn-primary" onClick={onApplyAll} style={{ width: '100%', padding: '12px', background: 'var(--bg-card-hover)', border: '1px solid var(--emerald)', color: 'var(--emerald)', fontWeight: 700 }}>⚡ Auto-Clean All Issues</button>
                </div>
              </motion.div>
            )}

            {activeTab === 'advanced' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="advanced-tools">
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

                {/* Custom Formula */}
                <div className="adv-section" style={{ marginTop: 20 }}>
                  <div className="adv-title">🧮 Custom Formula</div>
                  <div className="adv-row">
                    <label className="adv-label">New Column</label>
                    <input className="adv-input" placeholder="e.g. Total_Cost" value={formulaCol} onChange={e => setFormulaCol(e.target.value)} />
                  </div>
                  <div className="adv-row">
                    <label className="adv-label">Formula</label>
                    <input className="adv-input" placeholder="e.g. price * quantity" value={formulaText} onChange={e => setFormulaText(e.target.value)} />
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: 10 }}
                    disabled={!formulaCol || !formulaText}
                    onClick={() => {
                      if (onCustomFormula) onCustomFormula(formulaCol, formulaText);
                      setFormulaCol(''); setFormulaText('');
                    }}
                  >
                    Compute Formula
                  </button>
                </div>

                {/* Statistical Anomaly Detection */}
                <div className="adv-section" style={{ marginTop: 20 }}>
                  <div className="adv-title">🎯 Anomaly Detection</div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>
                    Automatically scan all numeric columns using Z-score (3σ) to find and remove statistical outliers.
                  </p>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      if (onDetectAnomalies) onDetectAnomalies();
                    }}
                  >
                    Scan & Remove Anomalies
                  </button>
                </div>
              </motion.div>
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
      </motion.div>

      {/* Time Travel Slider */}
      {rowHistoryLength > 0 && (
        <motion.div variants={itemVariants} className="card" style={{ marginTop: 20, background: 'rgba(255,255,255,0.02)', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ fontWeight: 600, color: 'var(--cyan)' }}>⏪ Time-Travel (Data Versioning)</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{rowHistoryLength} previous versions available</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Past</span>
            <input 
              type="range" 
              min="0" 
              max={rowHistoryLength} 
              defaultValue={rowHistoryLength}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val < rowHistoryLength && onTimeTravel) onTimeTravel(val);
              }}
              style={{ flex: 1, accentColor: 'var(--cyan)' }} 
            />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Present</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 0 }}>
              Drag the slider backward to instantly revert the dataset and all data quality checks to a previous state before an operation was applied.
            </p>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setShowDiff(!showDiff)}
            >
              {showDiff ? 'Hide Diff' : 'View Changes (Diff)'}
            </button>
          </div>

          {showDiff && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{ marginTop: '24px', overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Changes from previous step:</div>
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-body)', zIndex: 10 }}>
                    <tr>
                      <th style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>Status</th>
                      {headers.slice(0, 5).map(h => (
                        <th key={h} style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                      {headers.length > 5 && <th style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>...</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {calculateDataDiff(previousRows || rawRows, cleanedRows)
                      .filter(d => d.type !== 'unchanged')
                      .map((d, i) => (
                        <tr key={i} style={{ 
                          background: d.type === 'added' ? 'rgba(16,185,129,0.1)' : d.type === 'deleted' ? 'rgba(244,63,94,0.1)' : 'transparent',
                          color: d.type === 'added' ? 'var(--emerald)' : d.type === 'deleted' ? 'var(--rose)' : 'var(--text-primary)'
                        }}>
                          <td style={{ padding: '8px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>{d.type.toUpperCase()}</td>
                          {headers.slice(0, 5).map(h => (
                            <td key={h} style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{String(d.row[h] ?? '')}</td>
                          ))}
                          {headers.length > 5 && <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>...</td>}
                        </tr>
                      ))}
                    {calculateDataDiff(previousRows || rawRows, cleanedRows).filter(d => d.type !== 'unchanged').length === 0 && (
                      <tr>
                        <td colSpan={headers.length + 1} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No changes detected in this step.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* DQ Score */}
      <motion.div variants={itemVariants} className="card" style={{ marginTop: 20 }}>
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
      </motion.div>
    </motion.div>
  );
}
