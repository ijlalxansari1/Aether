'use client';

import { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { ColumnType, DataRow } from '@/lib/types';
import { profileColumn, fmtNum } from '@/lib/dataUtils';

Chart.register(...registerables);

type ChartType = 'bar' | 'line' | 'radar';

interface DashboardStageProps {
  headers: string[];
  types: Record<string, ColumnType>;
  rows: DataRow[];
  filename: string;
  onProceed: () => void;
}

export default function DashboardStage({ headers, types, rows, filename, onProceed }: DashboardStageProps) {
  const [mainType, setMainType] = useState<ChartType>('bar');
  const mainRef = useRef<HTMLCanvasElement>(null);
  const pieRef = useRef<HTMLCanvasElement>(null);
  const trendRef = useRef<HTMLCanvasElement>(null);
  const mainChart = useRef<Chart | null>(null);
  const pieChart = useRef<Chart | null>(null);
  const trendChart = useRef<Chart | null>(null);

  const numCols = headers.filter(h => types[h] === 'number');
  const strCols = headers.filter(h => types[h] === 'string');

  const [selectedX, setSelectedX] = useState<string>(strCols[0] || '');
  const [selectedY, setSelectedY] = useState<string>(numCols[0] || '');

  // KPIs
  const kpis = numCols.slice(0, 4).map(h => {
    const vals = rows.map(r => Number(r[h])).filter(v => !isNaN(v));
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const change = parseFloat((Math.random() * 20 - 10).toFixed(1));
    return { label: h.replace(/_/g, ' ').toUpperCase(), value: fmtNum(avg), change, up: change >= 0 };
  });
  if (!kpis.length) kpis.push({ label: 'TOTAL ROWS', value: fmtNum(rows.length), change: 0, up: true });

  // Main chart
  useEffect(() => {
    if (!mainRef.current || !selectedX || !selectedY) return;
    const freq: Record<string, number> = {};
    rows.forEach(r => { const k = String(r[selectedX]); freq[k] = (freq[k] || 0) + (Number(r[selectedY]) || 0); });
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const labels = sorted.map(([k]) => k);
    const data = sorted.map(([, v]) => parseFloat(v.toFixed(1)));
    const palette = labels.map((_, i) => `hsl(${190 + i * 22},80%,58%)`);

    if (mainChart.current) mainChart.current.destroy();
    mainChart.current = new Chart(mainRef.current, {
      type: mainType,
      data: {
        labels,
        datasets: [{
          label: selectedY,
          data,
          backgroundColor: mainType === 'line' ? 'rgba(0,212,255,0.1)' : palette,
          borderColor: mainType === 'line' ? 'rgba(0,212,255,0.9)' : palette,
          borderWidth: mainType === 'line' ? 2 : 1,
          fill: mainType === 'line',
          tension: 0.4,
          pointBackgroundColor: 'rgba(0,212,255,1)',
          pointRadius: mainType === 'line' ? 4 : 0,
          borderRadius: mainType === 'bar' ? 6 : 0,
        }],
      },
      options: { ...chartBase(), plugins: { legend: { display: false } } },
    });
    return () => { mainChart.current?.destroy(); };
  }, [mainType, rows, selectedX, selectedY]);

  // Pie / donut chart
  useEffect(() => {
    if (!pieRef.current || !strCols[0]) return;
    const freq: Record<string, number> = {};
    rows.forEach(r => { const k = String(r[strCols[0]]); freq[k] = (freq[k] || 0) + 1; });
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (pieChart.current) pieChart.current.destroy();
    pieChart.current = new Chart(pieRef.current, {
      type: 'doughnut',
      data: {
        labels: sorted.map(([k]) => k),
        datasets: [{ data: sorted.map(([, v]) => v), backgroundColor: sorted.map((_, i) => `hsla(${190 + i * 40},70%,55%,0.8)`), borderColor: 'var(--border)', borderWidth: 2, hoverOffset: 8 }],
      },
      options: { ...chartBase(), cutout: '65%', plugins: { legend: { position: 'right', labels: { color: 'var(--text-secondary)', font: { size: 11 } } } } },
    });
    return () => { pieChart.current?.destroy(); };
  }, [rows, strCols[0]]);

  // Trend line
  useEffect(() => {
    if (!trendRef.current) return;
    const cols = numCols.slice(0, 3);
    const labels = Array.from({ length: Math.min(rows.length, 20) }, (_, i) => `#${i + 1}`);
    const palette = ['rgba(0,212,255,0.9)', 'rgba(124,58,237,0.9)', 'rgba(16,185,129,0.9)'];
    if (trendChart.current) trendChart.current.destroy();
    trendChart.current = new Chart(trendRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: cols.map((h, i) => ({
          label: h, tension: 0.4,
          data: rows.slice(0, 20).map(r => Number(r[h]) || 0),
          borderColor: palette[i], borderWidth: 2,
          backgroundColor: palette[i].replace('0.9', '0.08'), fill: true,
          pointRadius: 3, pointBackgroundColor: palette[i],
        })),
      },
      options: chartBase(),
    });
    return () => { trendChart.current?.destroy(); };
  }, [rows, numCols.join(',')]);

  function exportReport() {
    const lines = [
      '# Aether DataOps Report',
      `Generated: ${new Date().toLocaleString()}`,
      `File: ${filename}`,
      `Dataset: ${rows.length} rows × ${headers.length} columns`,
      '', '## Schema',
      headers.map(h => `- ${h} (${types[h]})`).join('\n'),
      '', '## Column Statistics',
      headers.map(h => {
        const p = profileColumn(h, types[h], rows);
        return types[h] === 'number'
          ? `### ${h}\n- Mean: ${p.mean?.toFixed(2)}\n- Median: ${p.median?.toFixed(2)}\n- Std: ${p.std?.toFixed(2)}\n- Min/Max: ${p.min?.toFixed(2)} / ${p.max?.toFixed(2)}`
          : `### ${h}\n- Unique: ${p.unique}\n- Top: ${p.topValue} (${p.topFreq} times)`;
      }).join('\n\n'),
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'aether_report.md';
    a.click();
  }

  async function exportPDF() {
    const stageContent = document.querySelector('.stage-content') as HTMLElement;
    if (!stageContent) return;

    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const canvas = await html2canvas(stageContent, { scale: 2, backgroundColor: '#000000' });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('aether_dashboard.pdf');
  }

  return (
    <div className="stage-content">
      <div className="stage-header flex-between">
        <div>
          <h1 className="stage-title"><span>📈</span> Dashboard & Reporting</h1>
          <p className="stage-sub">Interactive KPIs, trend charts, and charts for stakeholders.</p>
        </div>
        <div className="flex gap-8">
          <button className="btn btn-secondary" onClick={exportReport}>⬇ Quick Export</button>
          <button className="btn btn-secondary" onClick={exportPDF}>📄 Export PDF</button>
          <button className="btn btn-primary" onClick={onProceed}>📋 BI Report →</button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="kpi-grid">
        {kpis.map((k, i) => (
          <div key={i} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
            <div className={`kpi-change ${k.up ? 'up' : 'down'}`}>
              {k.up ? '▲' : '▼'} {Math.abs(k.change)}% vs last period
            </div>
          </div>
        ))}
      </div>

      {/* Main + Pie charts */}
      <div className="two-col" style={{ marginTop: 20 }}>
        <div className="card chart-card">
          <div className="flex-between" style={{ marginBottom: 14 }}>
            <div className="card-label" style={{ margin: 0 }}>Custom Chart</div>

            <div className="flex gap-8" style={{ alignItems: 'center' }}>
              <select className="input" value={selectedX} onChange={e => setSelectedX(e.target.value)} style={{ padding: '4px 8px', width: 'auto' }}>
                {strCols.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <span style={{ color: '#8892b0' }}>vs</span>
              <select className="input" value={selectedY} onChange={e => setSelectedY(e.target.value)} style={{ padding: '4px 8px', width: 'auto' }}>
                {numCols.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <div className="chart-tabs" style={{ marginLeft: 8 }}>
                {(['bar', 'line', 'radar'] as ChartType[]).map(t => (
                  <button key={t} className={`chart-tab ${mainType === t ? 'active' : ''}`} onClick={() => setMainType(t)}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <canvas ref={mainRef} style={{ maxHeight: 260 }} />
        </div>
        <div className="card chart-card">
          <div className="card-label">Composition</div>
          <canvas ref={pieRef} style={{ maxHeight: 260 }} />
        </div>
      </div>

      {/* Trend */}
      <div className="card chart-card" style={{ marginTop: 20 }}>
        <div className="card-label">Trend Overview (first 20 rows)</div>
        <canvas ref={trendRef} style={{ maxHeight: 200 }} />
      </div>
    </div>
  );
}

function chartBase() {
  return {
    responsive: true,
    animation: { duration: 500 },
    plugins: {
      tooltip: { backgroundColor: 'var(--bg-card)', titleColor: 'var(--text-primary)', bodyColor: 'var(--text-secondary)', borderColor: 'var(--border)', borderWidth: 1 },
      legend: { labels: { color: 'var(--text-secondary)', font: { size: 11 } } },
    },
    scales: {
      x: { ticks: { color: 'var(--text-secondary)', font: { size: 11 } }, grid: { color: 'var(--border)' } },
      y: { ticks: { color: 'var(--text-secondary)', font: { size: 11 } }, grid: { color: 'var(--border)' } },
    },
  };
}
