'use client';

import { useEffect, useState } from 'react';
import { ColProfile, ColumnType, DataRow } from '@/lib/types';
import { profileColumn, calcBoxPlot, calcPearsonCorrelation, simulateABTest } from '@/lib/dataUtils';
import { getDb, loadDataToTable, executeQuery } from '@/lib/duckdbUtils';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';

interface AnalyzeStageProps {
  headers: string[];
  types: Record<string, ColumnType>;
  rows: DataRow[];
  onProceed: () => void;
  onUpdateRows?: (newHeaders: string[], newRows: DataRow[]) => void;
  onError?: (msg: string) => void;
}

type ActiveChart = 'distribution' | 'scatter' | 'boxplot' | 'correlation' | 'abtest';
type MainTab = 'bi' | 'sql';

export default function AnalyzeStage({ headers, types, rows, onProceed, onUpdateRows, onError }: AnalyzeStageProps) {
  const numCols = headers.filter(h => types[h] === 'number');
  const strCols = headers.filter(h => types[h] === 'string');
  const [activeDistCol, setActiveDistCol] = useState(numCols[0] ?? '');
  const [scatterX, setScatterX] = useState(numCols[0] ?? '');
  const [scatterY, setScatterY] = useState(numCols[1] ?? numCols[0] ?? '');
  const [scatterGroup, setScatterGroup] = useState(strCols[0] ?? '');
  const [activeChart, setActiveChart] = useState<ActiveChart>('distribution');
  const [mainTab, setMainTab] = useState<MainTab>('sql'); 

  // A/B Test State
  const [abTargetCol, setAbTargetCol] = useState(numCols[0] ?? '');
  const [abGroupCol, setAbGroupCol] = useState(strCols[0] ?? '');
  const [abControlVal, setAbControlVal] = useState('');
  const [abVariantVal, setAbVariantVal] = useState('');

  // SQL State
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM dataset LIMIT 10;');
  const [sqlResults, setSqlResults] = useState<DataRow[] | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [dbReady, setDbReady] = useState(false);

  // Initialize DuckDB
  useEffect(() => {
    async function init() {
      try {
        const db = await getDb();
        await loadDataToTable(db, 'dataset', rows);
        setDbReady(true);
      } catch (err: any) {
        onError?.('Failed to initialize DuckDB: ' + err.message);
      }
    }
    init();
  }, [rows, onError]);

  async function handleRunSQL() {
    if (!dbReady) return;
    setIsExecuting(true);
    try {
      const db = await getDb();
      const results = await executeQuery(db, sqlQuery);
      setSqlResults(results);
    } catch (err: any) {
      onError?.('SQL Error: ' + err.message);
    } finally {
      setIsExecuting(false);
    }
  }

  function handleApplySQL() {
    if (!sqlResults || sqlResults.length === 0) {
      onError?.('Cannot apply empty results');
      return;
    }
    const newHeaders = Object.keys(sqlResults[0]);
    onUpdateRows?.(newHeaders, sqlResults);
    setSqlResults(null);
  }

  // Calculate Distribution Data
  const distVals = rows.map(r => Number(r[activeDistCol])).filter(v => !isNaN(v)).sort((a, b) => a - b);
  const bins = 14;
  const min = Math.min(...distVals), max = Math.max(...distVals);
  const bw = (max - min) / bins || 1;
  const distCounts = Array(bins).fill(0);
  const distLabels: string[] = [];
  for (let i = 0; i < bins; i++) {
    distLabels.push((min + i * bw).toFixed(1));
    distVals.forEach(v => { if (v >= min + i * bw && v < min + (i + 1) * bw) distCounts[i]++; });
  }
  const distData = distLabels.map((name, i) => ({ name, value: distCounts[i] }));

  // Calculate Scatter Data
  const scatterData = rows.map(r => ({
    x: Number(r[scatterX]),
    y: Number(r[scatterY]),
    group: scatterGroup ? String(r[scatterGroup] ?? 'Other') : 'Data'
  })).filter(r => !isNaN(r.x) && !isNaN(r.y));

  // Box plot data (Mapped to Bar Chart representation)
  const boxCols = numCols.slice(0, 6);
  const boxDataRaw = boxCols.map(c => calcBoxPlot(c, rows));
  const boxData = boxDataRaw.map((b, i) => ({
    name: boxCols[i],
    min: b.min,
    q1: parseFloat((b.q1 - b.min).toFixed(2)),
    median: parseFloat((b.median - b.q1).toFixed(2)),
    q3: parseFloat((b.q3 - b.median).toFixed(2)),
    max: parseFloat((b.max - b.q3).toFixed(2))
  }));

  // Correlation Matrix Data
  const corrCols = numCols.slice(0, 6);
  const corrData = corrCols.map(c1 => {
    const row: any = { name: c1 };
    corrCols.forEach(c2 => {
      row[c2] = calcPearsonCorrelation(c1, c2, rows);
    });
    return row;
  });

  // A/B Test Results
  const abTestResults = activeChart === 'abtest' && abTargetCol && abGroupCol && abControlVal && abVariantVal ? 
    simulateABTest(abTargetCol, abGroupCol, abControlVal, abVariantVal, rows) : null;


  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="stage-content">
      <motion.div variants={itemVariants} className="stage-header flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="stage-title" style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            <span style={{ marginRight: '12px' }}>⚙️</span> Transform & Analyze
          </h1>
          <p className="stage-sub" style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '16px' }}>Use DuckDB SQL for complex transformations or view EDA charts.</p>
        </div>
        <button className="btn btn-primary" onClick={onProceed} style={{ background: 'linear-gradient(135deg, var(--emerald), var(--cyan))', border: 'none', color: '#fff', boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}>Generate Story →</button>
      </motion.div>

      <motion.div variants={itemVariants} className="chart-tabs" style={{ display: 'flex', gap: '32px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '32px', position: 'relative' }}>
        <div 
          className={`chart-tab ${mainTab === 'sql' ? 'active' : ''}`} 
          onClick={() => setMainTab('sql')}
          style={{ padding: '0 0 16px 0', color: mainTab === 'sql' ? 'var(--cyan)' : 'var(--text-secondary)', fontSize: '15px', fontWeight: mainTab === 'sql' ? 600 : 400, cursor: 'pointer', position: 'relative' }}
        >
          💾 SQL Workspace (DuckDB)
          {mainTab === 'sql' && <motion.div layoutId="mainTabActive" style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: 'var(--cyan)', boxShadow: '0 0 10px var(--cyan)' }} />}
        </div>
        <div 
          className={`chart-tab ${mainTab === 'bi' ? 'active' : ''}`} 
          onClick={() => setMainTab('bi')}
          style={{ padding: '0 0 16px 0', color: mainTab === 'bi' ? 'var(--cyan)' : 'var(--text-secondary)', fontSize: '15px', fontWeight: mainTab === 'bi' ? 600 : 400, cursor: 'pointer', position: 'relative' }}
        >
          📊 Exploratory Data Analysis (EDA)
          {mainTab === 'bi' && <motion.div layoutId="mainTabActive" style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: 'var(--cyan)', boxShadow: '0 0 10px var(--cyan)' }} />}
        </div>
      </motion.div>

      {mainTab === 'bi' ? (
        <motion.div variants={itemVariants} className="card chart-card">
          <div className="flex-between" style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>EDA Engine</h3>
            <div className="flex gap-8">
              {(['distribution', 'scatter', 'boxplot', 'correlation', 'abtest'] as ActiveChart[]).map(t => (
                <button 
                  key={t}
                  onClick={() => setActiveChart(t)} 
                  style={{ background: activeChart === t ? 'var(--accent)' : 'transparent', color: activeChart === t ? '#fff' : 'var(--text-muted)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
                >
                  {t === 'abtest' ? 'A/B Test' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              {activeChart === 'distribution' ? (
                <BarChart data={distData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="var(--cyan)" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : activeChart === 'scatter' ? (
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" dataKey="x" name={scatterX} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="number" dataKey="y" name={scatterY} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                  <Scatter name="Data" data={scatterData} fill="var(--violet)" />
                </ScatterChart>
              ) : activeChart === 'boxplot' ? (
                <BarChart data={boxData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                  <Bar dataKey="min" stackId="a" fill="transparent" />
                  <Bar dataKey="q1" stackId="a" fill="var(--violet)" radius={[0,0,0,0]} />
                  <Bar dataKey="median" stackId="a" fill="var(--cyan)" radius={[0,0,0,0]} />
                  <Bar dataKey="q3" stackId="a" fill="var(--emerald)" radius={[0,0,0,0]} />
                  <Bar dataKey="max" stackId="a" fill="var(--amber)" radius={[0,0,0,0]} />
                </BarChart>
              ) : activeChart === 'correlation' ? (
                <div style={{ display: 'grid', gridTemplateColumns: `100px repeat(${corrCols.length}, 1fr)`, gap: '4px', height: '100%' }}>
                  <div />
                  {corrCols.map(c => <div key={c} style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{c}</div>)}
                  {corrCols.map(c1 => (
                    <React.Fragment key={c1}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', paddingRight: '8px' }}>{c1}</div>
                      {corrCols.map(c2 => {
                        const val = corrData.find(r => r.name === c1)?.[c2] ?? 0;
                        const intensity = Math.abs(val);
                        const isPositive = val >= 0;
                        const bg = isPositive ? `rgba(16, 185, 129, ${intensity})` : `rgba(244, 63, 94, ${intensity})`;
                        return (
                          <div key={c2} style={{ background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: intensity > 0.5 ? '#fff' : 'var(--text-primary)', borderRadius: '4px' }}>
                            {val.toFixed(2)}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <select className="search-input" value={abTargetCol} onChange={e => setAbTargetCol(e.target.value)} style={{ padding: '8px', borderRadius: '8px', background: 'var(--bg-body)', color: '#fff', border: '1px solid var(--border)' }}>
                      {numCols.map(c => <option key={c} value={c}>Target: {c}</option>)}
                    </select>
                    <select className="search-input" value={abGroupCol} onChange={e => setAbGroupCol(e.target.value)} style={{ padding: '8px', borderRadius: '8px', background: 'var(--bg-body)', color: '#fff', border: '1px solid var(--border)' }}>
                      {strCols.map(c => <option key={c} value={c}>Group By: {c}</option>)}
                    </select>
                    <input className="search-input" placeholder="Control Group Value" value={abControlVal} onChange={e => setAbControlVal(e.target.value)} style={{ padding: '8px', borderRadius: '8px', background: 'var(--bg-body)', color: '#fff', border: '1px solid var(--border)' }} />
                    <input className="search-input" placeholder="Variant Group Value" value={abVariantVal} onChange={e => setAbVariantVal(e.target.value)} style={{ padding: '8px', borderRadius: '8px', background: 'var(--bg-body)', color: '#fff', border: '1px solid var(--border)' }} />
                  </div>
                  {abTestResults && (
                    <div style={{ background: 'var(--bg-body)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <h4 style={{ margin: '0 0 16px 0' }}>T-Test Results</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div><strong>Control Mean:</strong> {abTestResults.controlMean.toFixed(2)}</div>
                        <div><strong>Variant Mean:</strong> {abTestResults.variantMean.toFixed(2)}</div>
                        <div><strong>Absolute Difference:</strong> {abTestResults.diff.toFixed(2)}</div>
                        <div style={{ color: abTestResults.significant ? 'var(--emerald)' : 'var(--amber)' }}>
                          <strong>P-Value:</strong> {abTestResults.pValue.toFixed(4)} 
                          {abTestResults.significant ? ' (Statistically Significant!)' : ' (Not Significant)'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          <div className="card">
            <div className="card-label">DuckDB In-Browser SQL</div>
            <textarea
              className="search-input"
              style={{ width: '100%', height: '120px', fontFamily: 'monospace', padding: '16px', background: '#0a0a0a', border: '1px solid var(--border)', borderRadius: '8px', color: '#10b981', fontSize: '14px', resize: 'vertical' }}
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button className="btn btn-primary" onClick={handleRunSQL} disabled={isExecuting || !dbReady}>
                {isExecuting ? 'Running...' : '▶ Run Query'}
              </button>
              {sqlResults && (
                <button className="btn btn-secondary" onClick={handleApplySQL} style={{ background: 'var(--emerald)', color: '#fff', border: 'none' }}>
                  Apply as New Dataset
                </button>
              )}
            </div>
          </div>
          
          {sqlResults && (
            <div className="card">
              <div className="card-label">Query Results ({sqlResults.length} rows)</div>
              <div className="table-container" style={{ maxHeight: 300, overflowX: 'auto', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr>{Object.keys(sqlResults[0] || {}).map(k => <th key={k}>{k}</th>)}</tr>
                  </thead>
                  <tbody>
                    {sqlResults.map((r, i) => (
                      <tr key={i}>{Object.values(r).map((v: any, j) => <td key={j}>{String(v)}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
