'use client';

import { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { ColProfile, ColumnType, DataRow } from '@/lib/types';
import { profileColumn, calcBoxPlot } from '@/lib/dataUtils';

Chart.register(...registerables);

interface AnalyzeStageProps {
  headers: string[];
  types: Record<string, ColumnType>;
  rows: DataRow[];
  onProceed: () => void;
}

type ActiveChart = 'distribution' | 'scatter' | 'boxplot' | 'correlation';

export default function AnalyzeStage({ headers, types, rows, onProceed }: AnalyzeStageProps) {
  const numCols = headers.filter(h => types[h] === 'number');
  const strCols = headers.filter(h => types[h] === 'string');
  const [activeDistCol, setActiveDistCol] = useState(numCols[0] ?? '');
  const [scatterX, setScatterX] = useState(numCols[0] ?? '');
  const [scatterY, setScatterY] = useState(numCols[1] ?? numCols[0] ?? '');
  const [scatterGroup, setScatterGroup] = useState(strCols[0] ?? '');
  const [activeChart, setActiveChart] = useState<ActiveChart>('distribution');

  const distRef = useRef<HTMLCanvasElement>(null);
  const corrRef = useRef<HTMLCanvasElement>(null);
  const scatterRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLCanvasElement>(null);
  const distChart = useRef<Chart | null>(null);
  const corrChart = useRef<Chart | null>(null);
  const scatterChart = useRef<Chart | null>(null);
  const boxChart = useRef<Chart | null>(null);

  const profiles: ColProfile[] = headers.map(h => profileColumn(h, types[h], rows));

  // Distribution chart
  useEffect(() => {
    if (!activeDistCol || !distRef.current) return;
    const vals = rows.map(r => Number(r[activeDistCol])).filter(v => !isNaN(v)).sort((a, b) => a - b);
    if (!vals.length) return;
    const bins = 14;
    const min = Math.min(...vals), max = Math.max(...vals);
    const bw = (max - min) / bins || 1;
    const counts = Array(bins).fill(0);
    const labels: string[] = [];
    for (let i = 0; i < bins; i++) {
      labels.push((min + i * bw).toFixed(1));
      vals.forEach(v => { if (v >= min + i * bw && v < min + (i + 1) * bw) counts[i]++; });
    }
    if (distChart.current) distChart.current.destroy();
    distChart.current = new Chart(distRef.current, {
      type: 'bar',
      data: { labels, datasets: [{ label: activeDistCol, data: counts, backgroundColor: 'rgba(0,212,255,0.22)', borderColor: 'rgba(0,212,255,0.8)', borderWidth: 1, borderRadius: 4 }] },
      options: { ...chartBase(), plugins: { legend: { display: false } } },
    });
    return () => { distChart.current?.destroy(); };
  }, [activeDistCol, rows]);

  // Scatter plot
  useEffect(() => {
    if (!scatterRef.current || !scatterX || !scatterY) return;
    const groups: Record<string, { x: number; y: number }[]> = {};
    rows.forEach(r => {
      const x = Number(r[scatterX]), y = Number(r[scatterY]);
      if (isNaN(x) || isNaN(y)) return;
      const g = scatterGroup ? String(r[scatterGroup] ?? 'Other') : 'Data';
      if (!groups[g]) groups[g] = [];
      groups[g].push({ x, y });
    });
    const palette = Object.keys(groups).map((_, i) => `hsl(${190 + i * 55},75%,58%)`);
    if (scatterChart.current) scatterChart.current.destroy();
    scatterChart.current = new Chart(scatterRef.current, {
      type: 'scatter',
      data: {
        datasets: Object.entries(groups).map(([label, data], i) => ({
          label, data,
          backgroundColor: palette[i]?.replace('58%', '55%') + 'cc',
          borderColor: palette[i],
          borderWidth: 1, pointRadius: 4,
        })),
      },
      options: {
        ...chartBase(),
        plugins: { legend: { position: 'top', labels: { color: '#8892b0', font: { size: 11 } } } },
        scales: {
          x: { title: { display: true, text: scatterX, color: '#8892b0' }, ticks: { color: '#8892b0' }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { title: { display: true, text: scatterY, color: '#8892b0' }, ticks: { color: '#8892b0' }, grid: { color: 'rgba(255,255,255,0.06)' } },
        },
      },
    });
    return () => { scatterChart.current?.destroy(); };
  }, [scatterX, scatterY, scatterGroup, rows]);

  // Box plot (simulated as floating bar chart)
  useEffect(() => {
    if (!boxRef.current || !numCols.length) return;
    const cols = numCols.slice(0, 6);
    const boxData = cols.map(c => calcBoxPlot(c, rows));
    if (boxChart.current) boxChart.current.destroy();
    boxChart.current = new Chart(boxRef.current, {
      type: 'bar',
      data: {
        labels: cols,
        datasets: [
          { label: 'Min→Q1', data: boxData.map(b => b.q1 - b.min), backgroundColor: 'rgba(124,58,237,0.25)', stack: 'box' },
          { label: 'Q1→Median', data: boxData.map(b => b.median - b.q1), backgroundColor: 'rgba(0,212,255,0.4)', stack: 'box' },
          { label: 'Median→Q3', data: boxData.map(b => b.q3 - b.median), backgroundColor: 'rgba(0,212,255,0.25)', stack: 'box' },
          { label: 'Q3→Max', data: boxData.map(b => b.max - b.q3), backgroundColor: 'rgba(124,58,237,0.15)', stack: 'box' },
          { type: 'line', label: 'Mean', data: boxData.map(b => b.mean), borderColor: 'rgba(245,158,11,0.9)', borderWidth: 2, borderDash: [4, 4], pointBackgroundColor: 'var(--amber)', pointRadius: 5, fill: false } as unknown as Chart['data']['datasets'][number],
        ],
      },
      options: {
        ...chartBase(),
        plugins: { legend: { position: 'top', labels: { color: '#8892b0', font: { size: 10 } } } },
      },
    });
    return () => { boxChart.current?.destroy(); };
  }, [rows, numCols.join(',')]);

  // Correlation bubble
  useEffect(() => {
    if (!corrRef.current || numCols.length < 2) return;
    const cols = numCols.slice(0, 6);
    const colors: string[] = [];
    const data = cols.flatMap((a, i) => cols.map((b, j) => {
      const va = rows.map(r => Number(r[a])).filter(v => !isNaN(v));
      const vb = rows.map(r => Number(r[b])).filter(v => !isNaN(v));
      const n = Math.min(va.length, vb.length);
      const ma = va.slice(0, n).reduce((s, v) => s + v, 0) / n;
      const mb = vb.slice(0, n).reduce((s, v) => s + v, 0) / n;
      const num = va.slice(0, n).reduce((s, v, k) => s + (v - ma) * (vb[k] - mb), 0);
      const da = Math.sqrt(va.slice(0, n).reduce((s, v) => s + (v - ma) ** 2, 0));
      const db = Math.sqrt(vb.slice(0, n).reduce((s, v) => s + (v - mb) ** 2, 0));
      const corr = da && db ? num / (da * db) : 0;
      colors.push(corr >= 0 ? `rgba(0,212,255,${Math.abs(corr) * 0.8 + 0.1})` : `rgba(244,63,94,${Math.abs(corr) * 0.8 + 0.1})`);
      return { x: j, y: i, r: Math.abs(corr) * 22 + 4, label: `${a}↔${b}: ${corr.toFixed(2)}` };
    }));
    if (corrChart.current) corrChart.current.destroy();
    corrChart.current = new Chart(corrRef.current, {
      type: 'bubble',
      data: { datasets: [{ label: 'Correlation', data, backgroundColor: colors }] },
      options: {
        ...chartBase(),
        scales: {
          x: { ticks: { callback: (v) => cols[v as number] ?? '', color: '#8892b0' }, grid: { color: 'rgba(255,255,255,0.04)' }, min: -0.5, max: cols.length - 0.5 },
          y: { ticks: { callback: (v) => cols[v as number] ?? '', color: '#8892b0' }, grid: { color: 'rgba(255,255,255,0.04)' }, min: -0.5, max: cols.length - 0.5 },
        },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => (c.raw as { label: string }).label } } },
      },
    });
    return () => { corrChart.current?.destroy(); };
  }, [rows, numCols.join(',')]);

  const CHART_TABS: { id: ActiveChart; label: string; icon: string }[] = [
    { id: 'distribution', label: 'Distribution', icon: '📊' },
    { id: 'scatter', label: 'Scatter Plot', icon: '⬡' },
    { id: 'boxplot', label: 'Box Plot', icon: '📦' },
    { id: 'correlation', label: 'Correlation', icon: '🔗' },
  ];

  return (
    <div className="stage-content">
      <div className="stage-header flex-between">
        <div>
          <h1 className="stage-title"><span>📊</span> Data Analysis & BI</h1>
          <p className="stage-sub">Distribution, scatter plots, box plots, correlation matrix, and column profiles.</p>
        </div>
        <button className="btn btn-primary" onClick={onProceed}>Generate Story →</button>
      </div>

      {/* Main chart area */}
      <div className="card chart-card">
        <div className="flex-between" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div className="chart-tabs">
            {CHART_TABS.map(t => (
              <button key={t.id} className={`chart-tab ${activeChart === t.id ? 'active' : ''}`} onClick={() => setActiveChart(t.id)}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Distribution */}
        {activeChart === 'distribution' && (
          <>
            <div className="chart-tabs" style={{ marginBottom: 14 }}>
              {numCols.slice(0, 6).map(c => (
                <button key={c} className={`chart-tab ${c === activeDistCol ? 'active' : ''}`} onClick={() => setActiveDistCol(c)}>{c}</button>
              ))}
            </div>
            <canvas ref={distRef} style={{ maxHeight: 300 }} />
          </>
        )}

        {/* Scatter */}
        {activeChart === 'scatter' && (
          <>
            <div className="flex gap-8" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
              <div className="axis-picker">
                <label className="adv-label">X Axis</label>
                <select className="adv-select" value={scatterX} onChange={e => setScatterX(e.target.value)}>
                  {numCols.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="axis-picker">
                <label className="adv-label">Y Axis</label>
                <select className="adv-select" value={scatterY} onChange={e => setScatterY(e.target.value)}>
                  {numCols.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {strCols.length > 0 && (
                <div className="axis-picker">
                  <label className="adv-label">Color by</label>
                  <select className="adv-select" value={scatterGroup} onChange={e => setScatterGroup(e.target.value)}>
                    <option value="">None</option>
                    {strCols.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
            </div>
            <canvas ref={scatterRef} style={{ maxHeight: 300 }} />
          </>
        )}

        {/* Box plot */}
        {activeChart === 'boxplot' && (
          <>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Shows Q1→Q3 interquartile range (stacked bars) with median and mean line · Dashed = Mean
            </div>
            <canvas ref={boxRef} style={{ maxHeight: 300 }} />
          </>
        )}

        {/* Correlation */}
        {activeChart === 'correlation' && (
          <>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Bubble size = correlation strength · Cyan = positive · Red = negative
            </div>
            <canvas ref={corrRef} style={{ maxHeight: 300 }} />
          </>
        )}
      </div>

      {/* Column profiles */}
      <div style={{ marginTop: 20 }}>
        <div className="card-label">Column Profiles</div>
        <div className="profile-grid">
          {profiles.map(p => (
            <div key={p.name} className="profile-card">
              <div className="profile-name">
                <span className={`schema-pill type-${p.type === 'number' ? 'cyan' : p.type === 'boolean' ? 'green' : p.type === 'date' ? 'amber' : 'violet'}`}>
                  {p.name}
                </span>
              </div>
              {p.type === 'number'
                ? [['Count', p.count], ['Mean', p.mean?.toFixed(2)], ['Median', p.median?.toFixed(2)], ['Std', p.std?.toFixed(2)], ['Min', p.min?.toFixed(2)], ['Max', p.max?.toFixed(2)]]
                    .map(([k, v]) => <div key={String(k)} className="mini-stat"><span>{k}</span><strong>{v}</strong></div>)
                : [['Count', p.count], ['Unique', p.unique], ['Top', p.topValue], ['Freq', p.topFreq]]
                    .map(([k, v]) => <div key={String(k)} className="mini-stat"><span>{k}</span><strong>{v}</strong></div>)
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function chartBase() {
  return {
    responsive: true,
    animation: { duration: 500 },
    plugins: {
      tooltip: { backgroundColor: 'rgba(8,8,24,0.95)', titleColor: '#f0f4ff', bodyColor: '#8892b0', borderColor: 'rgba(0,212,255,0.2)', borderWidth: 1 },
      legend: { labels: { color: '#8892b0', font: { size: 11 } } },
    },
    scales: {
      x: { ticks: { color: '#8892b0', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { ticks: { color: '#8892b0', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.06)' } },
    },
  };
}
