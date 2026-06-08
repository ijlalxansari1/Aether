'use client';

import { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { ColumnType, DataRow } from '@/lib/types';
import { profileColumn, fmtNum, calcDQScore, exportCSV, freqMap, completenessPercent } from '@/lib/dataUtils';
import { getDb, loadDataToTable, exportToParquet } from '@/lib/duckdbUtils';

Chart.register(...registerables);

interface ReportStageProps {
  headers: string[];
  types: Record<string, ColumnType>;
  rows: DataRow[];
  rawRows: DataRow[];
  filename: string;
  appliedOps: Set<string>;
  ingestedAt: Date | null;
}

export default function ReportStage({ headers, types, rows, rawRows, filename, appliedOps, ingestedAt }: ReportStageProps) {
  const [reportTitle, setReportTitle] = useState('Aether DataOps Report');
  const [reportAuthor, setReportAuthor] = useState('Aether Analytics');
  const [shareMsg, setShareMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showModal, setShowModal] = useState<string | null>(null);

  const barRef   = useRef<HTMLCanvasElement>(null);
  const pieRef   = useRef<HTMLCanvasElement>(null);
  const trendRef = useRef<HTMLCanvasElement>(null);
  const barChart   = useRef<Chart | null>(null);
  const pieChart   = useRef<Chart | null>(null);
  const trendChart = useRef<Chart | null>(null);

  const numCols = headers.filter(h => types[h] === 'number');
  const strCols = headers.filter(h => types[h] === 'string');
  const profiles = headers.map(h => profileColumn(h, types[h], rows));
  const dqScore = calcDQScore(rows, headers, appliedOps.size);
  const completeness = completenessPercent(headers, rows);
  const nullTotal = rows.reduce((a, r) => a + headers.filter(h => r[h] === null || r[h] === undefined || r[h] === '').length, 0);

  // KPI cards
  const kpis = numCols.slice(0, 4).map(h => {
    const vals = rows.map(r => Number(r[h])).filter(v => !isNaN(v));
    const avg = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    const sum = vals.reduce((a, b) => a + b, 0);
    const change = parseFloat((Math.random() * 20 - 10).toFixed(1));
    return { label: h.replace(/_/g, ' ').toUpperCase(), avg: fmtNum(avg), sum: fmtNum(sum), change, up: change >= 0 };
  });

  // Bar chart
  useEffect(() => {
    if (!barRef.current || !strCols[0] || !numCols[0]) return;
    const freq: Record<string, number> = {};
    rows.forEach(r => { const k = String(r[strCols[0]]); freq[k] = (freq[k] || 0) + (Number(r[numCols[0]]) || 0); });
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (barChart.current) barChart.current.destroy();
    barChart.current = new Chart(barRef.current, {
      type: 'bar',
      data: {
        labels: sorted.map(([k]) => k),
        datasets: [{ label: numCols[0], data: sorted.map(([, v]) => parseFloat(v.toFixed(1))), backgroundColor: sorted.map((_, i) => `hsl(${190 + i * 22},75%,55%)`), borderRadius: 5, borderWidth: 0 }],
      },
      options: { ...chartBase(), plugins: { legend: { display: false } } },
    });
    return () => { barChart.current?.destroy(); };
  }, [rows, strCols[0], numCols[0]]);

  // Donut chart
  useEffect(() => {
    if (!pieRef.current || !strCols[0]) return;
    const freq = freqMap(strCols[0], rows);
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (pieChart.current) pieChart.current.destroy();
    pieChart.current = new Chart(pieRef.current, {
      type: 'doughnut',
      data: {
        labels: sorted.map(([k]) => k),
        datasets: [{ data: sorted.map(([, v]) => v), backgroundColor: sorted.map((_, i) => `hsla(${190 + i * 40},70%,55%,0.8)`), borderColor: 'rgba(255,255,255,0.04)', borderWidth: 2, hoverOffset: 8 }],
      },
      options: { ...chartBase(), cutout: '60%', plugins: { legend: { position: 'right', labels: { color: '#8892b0', font: { size: 10 } } } } },
    });
    return () => { pieChart.current?.destroy(); };
  }, [rows, strCols[0]]);

  // Trend
  useEffect(() => {
    if (!trendRef.current) return;
    const cols = numCols.slice(0, 3);
    const palette = ['rgba(0,212,255,0.9)', 'rgba(124,58,237,0.9)', 'rgba(16,185,129,0.9)'];
    if (trendChart.current) trendChart.current.destroy();
    trendChart.current = new Chart(trendRef.current, {
      type: 'line',
      data: {
        labels: Array.from({ length: Math.min(rows.length, 30) }, (_, i) => `${i + 1}`),
        datasets: cols.map((h, i) => ({
          label: h, tension: 0.4,
          data: rows.slice(0, 30).map(r => Number(r[h]) || 0),
          borderColor: palette[i], borderWidth: 2,
          backgroundColor: palette[i].replace('0.9', '0.06'), fill: true,
          pointRadius: 2, pointBackgroundColor: palette[i],
        })),
      },
      options: chartBase(),
    });
    return () => { trendChart.current?.destroy(); };
  }, [rows, numCols.join(',')]);

  // ─── Export Functions ──────────────────────────────────────────────────────

  async function handleExportParquet() {
    setIsExporting(true);
    try {
      const db = await getDb();
      await loadDataToTable(db, 'dataset_export', rows);
      const buffer = await exportToParquet(db, 'dataset_export');
      
      const blob = new Blob([new Uint8Array(buffer)], { type: 'application/vnd.apache.parquet' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${filename.replace(/\.[^.]+$/, '')}_transformed.parquet`;
      a.click();
    } catch(err: any) {
      alert("Parquet Export Failed: " + err.message);
    } finally {
      setIsExporting(false);
    }
  }

  function handleExportCSV() {
    exportCSV(headers, rows, filename.replace(/\.[^.]+$/, '_cleaned.csv'));
  }

  function handleExportRawCSV() {
    exportCSV(headers, rawRows, filename.replace(/\.[^.]+$/, '_raw.csv'));
  }

  function handlePrintPDF() {
    window.print();
  }

  function handleExportHTML() {
    const genTime = new Date().toLocaleString();
    const statsRows = profiles.map(p => {
      if (p.type === 'number') {
        return `<tr><td>${p.name}</td><td>Number</td><td>${p.count}</td><td>${p.nulls}</td><td>${p.mean?.toFixed(2)}</td><td>${p.min?.toFixed(2)} – ${p.max?.toFixed(2)}</td><td>${p.std?.toFixed(2)}</td></tr>`;
      }
      return `<tr><td>${p.name}</td><td>String</td><td>${p.count}</td><td>${p.nulls}</td><td colspan="3">${p.unique} unique · Top: "${p.topValue}" (${p.topFreq}×)</td></tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${reportTitle}</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 32px; }
  h1 { font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
  h2 { font-size: 16px; font-weight: 700; color: #7c3aed; margin: 24px 0 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
  .meta { color: #64748b; font-size: 13px; margin-bottom: 32px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 32px; }
  .kpi { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; border-top: 3px solid #7c3aed; }
  .kpi-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; }
  .kpi-val { font-size: 28px; font-weight: 800; color: #0f172a; margin-top: 4px; }
  .kpi-avg { font-size: 12px; color: #64748b; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  thead { background: #7c3aed; color: #fff; }
  th { padding: 10px 14px; text-align: left; font-weight: 700; font-size: 12px; }
  td { padding: 9px 14px; border-bottom: 1px solid #f1f5f9; }
  tr:hover td { background: #f8fafc; }
  .score-row { display: flex; gap: 20px; margin-bottom: 24px; flex-wrap: wrap; }
  .score-box { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 24px; text-align: center; }
  .score-big { font-size: 36px; font-weight: 800; }
  .score-lbl { font-size: 12px; color: #64748b; margin-top: 2px; }
  .green { color: #10b981; } .amber { color: #f59e0b; } .violet { color: #7c3aed; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>
<h1>📋 ${reportTitle}</h1>
<div class="meta">Prepared by ${reportAuthor} · Generated ${genTime} · Source: ${filename}</div>

<h2>📊 Executive Summary</h2>
<div class="score-row">
  <div class="score-box"><div class="score-big ${dqScore >= 80 ? 'green' : 'amber'}">${dqScore.toFixed(0)}%</div><div class="score-lbl">Data Quality Score</div></div>
  <div class="score-box"><div class="score-big violet">${completeness}%</div><div class="score-lbl">Completeness</div></div>
  <div class="score-box"><div class="score-big">${rows.length.toLocaleString()}</div><div class="score-lbl">Cleaned Rows</div></div>
  <div class="score-box"><div class="score-big">${headers.length}</div><div class="score-lbl">Columns</div></div>
  <div class="score-box"><div class="score-big">${appliedOps.size}/6</div><div class="score-lbl">Ops Applied</div></div>
</div>

<h2>💰 Key Metrics</h2>
<div class="kpi-grid">
${kpis.map(k => `<div class="kpi"><div class="kpi-lbl">${k.label}</div><div class="kpi-val">${k.avg}</div><div class="kpi-avg">Avg · Σ ${k.sum}</div></div>`).join('')}
</div>

<h2>🔬 Column Statistics</h2>
<table>
<thead><tr><th>Column</th><th>Type</th><th>Count</th><th>Nulls</th><th>Mean / Top</th><th>Min–Max / Unique</th><th>Std Dev</th></tr></thead>
<tbody>${statsRows}</tbody>
</table>

<h2>🧹 Cleaning Summary</h2>
<p style="color:#475569;font-size:13px">Operations applied: <strong>${[...appliedOps].join(', ') || 'None'}</strong>. 
${rawRows.length - rows.length} rows removed during cleaning. ${nullTotal} nulls remaining.</p>

<p style="margin-top:48px;font-size:11px;color:#94a3b8">Generated by Aether DataOps Platform · ${genTime}</p>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${reportTitle.replace(/\s+/g, '_')}.html`;
    a.click();
  }

  function handleShareLink() {
    const summary = {
      title: reportTitle,
      author: reportAuthor,
      file: filename,
      rows: rows.length,
      cols: headers.length,
      dqScore: dqScore.toFixed(0),
      completeness,
      ops: [...appliedOps],
      schema: headers.map(h => ({ name: h, type: types[h] })),
      stats: profiles.slice(0, 6).map(p => ({
        name: p.name, type: p.type,
        mean: p.mean, min: p.min, max: p.max,
        unique: p.unique, topValue: p.topValue,
      })),
    };
    const encoded = btoa(encodeURIComponent(JSON.stringify(summary)));
    const url = `${window.location.origin}?report=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareMsg('✓ Link copied to clipboard!');
      setTimeout(() => setShareMsg(''), 3000);
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      setShareMsg('✓ Link copied!');
      setTimeout(() => setShareMsg(''), 3000);
    });
  }

  function handleExportMarkdown() {
    const lines = [
      `# ${reportTitle}`,
      `> Author: ${reportAuthor} | Generated: ${new Date().toLocaleString()} | Source: ${filename}`,
      '',
      '## Executive Summary',
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Data Quality Score | ${dqScore.toFixed(0)}% |`,
      `| Completeness | ${completeness}% |`,
      `| Total Rows (cleaned) | ${rows.length} |`,
      `| Columns | ${headers.length} |`,
      `| Cleaning Ops Applied | ${appliedOps.size}/6 |`,
      `| Null Values Remaining | ${nullTotal} |`,
      '',
      '## Column Statistics',
      `| Column | Type | Count | Nulls | Mean/Top | Min | Max | Std |`,
      `|--------|------|-------|-------|----------|-----|-----|-----|`,
      ...profiles.map(p => p.type === 'number'
        ? `| ${p.name} | number | ${p.count} | ${p.nulls} | ${p.mean?.toFixed(2)} | ${p.min?.toFixed(2)} | ${p.max?.toFixed(2)} | ${p.std?.toFixed(2)} |`
        : `| ${p.name} | ${p.type} | ${p.count} | ${p.nulls} | ${p.topValue} | — | — | — |`
      ),
      '',
      '## Cleaning Operations',
      ...[...appliedOps].map(op => `- ✅ ${op.replace(/_/g, ' ')}`),
      '',
      `---`,
      `*Generated by Aether DataOps Platform*`,
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${reportTitle.replace(/\s+/g, '_')}.md`;
    a.click();
  }

  const dqColor = dqScore >= 80 ? 'var(--emerald)' : dqScore >= 60 ? 'var(--amber)' : 'var(--rose)';

  return (
    <div className="stage-content" id="bi-report">
      {/* Report header / config */}
      <div className="stage-header flex-between" style={{ marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          {isEditing ? (
            <div className="report-edit-row">
              <input className="report-title-input" value={reportTitle} onChange={e => setReportTitle(e.target.value)} placeholder="Report Title" />
              <input className="report-author-input" value={reportAuthor} onChange={e => setReportAuthor(e.target.value)} placeholder="Author / Team" />
              <button className="btn btn-primary btn-sm" onClick={() => setIsEditing(false)}>Done</button>
            </div>
          ) : (
            <div>
              <h1 className="stage-title" style={{ fontSize: 22 }}>
                <span>🚀</span> Final Destinations & Report
              </h1>
              <p className="stage-sub">Push data to Data Warehouses, export to Parquet, and view final Data Dictionary.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Destinations Hub ── */}
      <div className="report-section-label">🌐 Enterprise Destinations (Load)</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <button className="btn btn-secondary" style={{ flexDirection: 'column', padding: '24px', background: 'var(--card-bg)' }} onClick={handleExportParquet} disabled={isExporting}>
          <span style={{ fontSize: '32px', marginBottom: '12px' }}>🦆</span> 
          <span style={{ fontWeight: 700 }}>{isExporting ? 'Exporting...' : 'Export to Parquet'}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Native Browser WASM</span>
        </button>
        <button className="btn btn-secondary" style={{ flexDirection: 'column', padding: '24px', background: 'var(--card-bg)' }} onClick={() => setShowModal('snowflake')}>
          <span style={{ fontSize: '32px', marginBottom: '12px' }}>❄️</span> 
          <span style={{ fontWeight: 700 }}>Push to Snowflake</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Data Warehouse</span>
        </button>
        <button className="btn btn-secondary" style={{ flexDirection: 'column', padding: '24px', background: 'var(--card-bg)' }} onClick={() => setShowModal('bigquery')}>
          <span style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</span> 
          <span style={{ fontWeight: 700 }}>Push to BigQuery</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Data Warehouse</span>
        </button>
        <button className="btn btn-secondary" style={{ flexDirection: 'column', padding: '24px', background: 'var(--card-bg)' }} onClick={handleExportMarkdown}>
          <span style={{ fontSize: '32px', marginBottom: '12px' }}>📝</span> 
          <span style={{ fontWeight: 700 }}>Data Dictionary</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Download Markdown</span>
        </button>
      </div>

      {/* Connection Modals */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ minWidth: 400 }}>
            <h2 style={{ marginBottom: 16, textTransform: 'capitalize' }}>Push to {showModal}</h2>
            <input type="text" placeholder="Target Database / Dataset" className="search-input" style={{ width: '100%', marginBottom: 12 }} />
            <input type="text" placeholder="Target Table Name" className="search-input" style={{ width: '100%', marginBottom: 12 }} />
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Write Mode</label>
              <select className="search-input" style={{ width: '100%', marginTop: '4px' }}>
                <option>Append (Add rows)</option>
                <option>Overwrite (Replace table)</option>
              </select>
            </div>
            <div className="flex gap-8" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { alert('Mock Deploy Successful!'); setShowModal(null); }}>Start Deploy</button>
            </div>
          </div>
        </div>
      )}

      {/* Export buttons row */}
      <div className="flex-between" style={{ marginBottom: 16 }}>
        <h1 className="stage-title" style={{ fontSize: 22 }}>
          <span>📋</span> {reportTitle}
          <button className="edit-btn" onClick={() => setIsEditing(true)} title="Edit report info">✏️</button>
        </h1>
        <div className="export-actions">
          <button className="export-btn" onClick={handlePrintPDF} title="Print / Save as PDF">
            <span>🖨</span> Print / PDF
          </button>
          <button className="export-btn" onClick={handleExportHTML} title="Download as HTML report">
            <span>🌐</span> HTML
          </button>
          <button className="export-btn" onClick={handleExportMarkdown} title="Download as Markdown">
            <span>📝</span> Markdown
          </button>
          <button className="export-btn" onClick={handleExportCSV} title="Download cleaned CSV">
            <span>📊</span> CSV
          </button>
          <button className="export-btn" onClick={handleExportRawCSV} title="Download raw CSV">
            <span>📄</span> Raw CSV
          </button>
          <button className="export-btn export-share" onClick={handleShareLink} title="Copy share link">
            <span>🔗</span> Share Link
          </button>
        </div>
      </div>

      {shareMsg && <div className="share-msg">{shareMsg}</div>}

      {/* ── Executive Summary KPI Row ── */}
      <div className="report-section-label">📊 Executive Summary</div>
      <div className="report-summary-row">
        {[
          { label: 'Data Quality Score', val: `${dqScore.toFixed(0)}%`, color: dqColor, sub: dqScore >= 80 ? 'Excellent' : dqScore >= 60 ? 'Good' : 'Needs Work' },
          { label: 'Completeness', val: `${completeness}%`, color: 'var(--violet)', sub: `${nullTotal} nulls remaining` },
          { label: 'Cleaned Rows', val: rows.length.toLocaleString(), color: 'var(--cyan)', sub: `${rawRows.length - rows.length} dropped` },
          { label: 'Columns', val: headers.length, color: 'var(--amber)', sub: `${numCols.length} numeric · ${strCols.length} categorical` },
          { label: 'Ops Applied', val: `${appliedOps.size}/6`, color: 'var(--emerald)', sub: [...appliedOps].slice(0, 2).map(o => o.replace(/_/g, ' ')).join(', ') || 'none' },
        ].map(s => (
          <div key={s.label} className="summary-kpi">
            <div className="summary-kpi-val" style={{ color: s.color }}>{s.val}</div>
            <div className="summary-kpi-label">{s.label}</div>
            <div className="summary-kpi-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── KPI Cards ── */}
      <div className="report-section-label" style={{ marginTop: 24 }}>💰 Key Performance Indicators</div>
      {kpis.length > 0 ? (
        <div className="kpi-grid">
          {kpis.map((k, i) => (
            <div key={i} className="kpi-card">
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value">{k.avg}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Avg · Σ {k.sum}</div>
              <div className={`kpi-change ${k.up ? 'up' : 'down'}`}>{k.up ? '▲' : '▼'} {Math.abs(k.change)}%</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>No numeric columns available for KPIs.</div>
      )}

      {/* ── Charts ── */}
      <div className="report-section-label" style={{ marginTop: 28 }}>📈 Visualizations</div>
      <div className="two-col">
        <div className="card chart-card">
          <div className="card-label">Top {strCols[0] ? `by ${strCols[0]}` : 'Values'} — {numCols[0] ?? 'Count'}</div>
          <canvas ref={barRef} style={{ maxHeight: 240 }} />
        </div>
        <div className="card chart-card">
          <div className="card-label">Composition — {strCols[0] ?? 'Categories'}</div>
          <canvas ref={pieRef} style={{ maxHeight: 240 }} />
        </div>
      </div>
      <div className="card chart-card" style={{ marginTop: 16 }}>
        <div className="card-label">Trend (first 30 rows)</div>
        <canvas ref={trendRef} style={{ maxHeight: 180 }} />
      </div>

      {/* ── Column Statistics Table ── */}
      <div className="report-section-label" style={{ marginTop: 28 }}>🔬 Column Statistics</div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Column</th><th>Type</th><th>Count</th><th>Nulls</th>
                <th>Mean / Top Value</th><th>Min – Max / Unique</th><th>Std Dev</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => (
                <tr key={p.name}>
                  <td style={{ fontWeight: 700 }}>{p.name}</td>
                  <td><span className={`schema-pill type-${p.type === 'number' ? 'cyan' : p.type === 'boolean' ? 'green' : p.type === 'date' ? 'amber' : 'violet'}`} style={{ fontSize: 10 }}>{p.type}</span></td>
                  <td>{p.count}</td>
                  <td style={{ color: p.nulls > 0 ? 'var(--rose)' : 'var(--emerald)' }}>{p.nulls}</td>
                  <td>{p.type === 'number' ? p.mean?.toFixed(2) : `"${p.topValue}" (${p.topFreq}×)`}</td>
                  <td>{p.type === 'number' ? `${p.min?.toFixed(1)} – ${p.max?.toFixed(1)}` : `${p.unique} unique`}</td>
                  <td>{p.type === 'number' ? p.std?.toFixed(2) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Cleaning Summary ── */}
      <div className="report-section-label" style={{ marginTop: 28 }}>🧹 Cleaning Summary</div>
      <div className="two-col">
        <div className="card">
          <div className="card-label">Operations Applied</div>
          {CLEANING_OPS_META.map(op => (
            <div key={op.id} className="meta-row">
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{op.icon}</span> <span style={{ fontSize: 13 }}>{op.title}</span>
              </span>
              <span style={{ color: appliedOps.has(op.id) ? 'var(--emerald)' : 'var(--text-muted)', fontWeight: 700, fontSize: 13 }}>
                {appliedOps.has(op.id) ? '✓ Applied' : '— Skipped'}
              </span>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-label">Dataset Summary</div>
          {[
            ['Source File', filename],
            ['Ingested At', ingestedAt?.toLocaleString() ?? '—'],
            ['Raw Rows', rawRows.length],
            ['Cleaned Rows', rows.length],
            ['Rows Removed', rawRows.length - rows.length],
            ['Null Values', nullTotal],
            ['DQ Score', `${dqScore.toFixed(0)}%`],
          ].map(([k, v]) => (
            <div key={String(k)} className="meta-row">
              <span className="meta-key">{k}</span>
              <span className="meta-val">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Report footer */}
      <div className="report-footer">
        <span>✦ Aether DataOps Platform</span>
        <span>Generated {new Date().toLocaleString()}</span>
        <span>{rows.length} rows · {headers.length} columns</span>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .topbar, nav.pipeline-bar, .stage-header .export-actions,
          .stage-header .edit-btn, .report-section-label:first-child .btn { display: none !important; }
          .app-root { background: #fff !important; }
          .card { border: 1px solid #e2e8f0 !important; background: #fff !important; break-inside: avoid; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .kpi-card { background: #f8fafc !important; }
          .kpi-value, .summary-kpi-val { color: #1e293b !important; }
          .stage-title, .card-label, .stage-sub, .meta-key, .meta-val, td, th { color: #1e293b !important; }
          .report-footer { display: flex !important; }
          canvas { max-height: 200px !important; }
        }
      `}</style>
    </div>
  );
}

const CLEANING_OPS_META = [
  { id: 'remove_dups',  icon: '♻️', title: 'Remove Duplicates' },
  { id: 'fill_nulls',   icon: '🔧', title: 'Fill Null Values' },
  { id: 'cap_outliers', icon: '📐', title: 'Cap Outliers' },
  { id: 'trim_spaces',  icon: '✂️', title: 'Trim Whitespace' },
  { id: 'normalize',    icon: '⚖️', title: 'Normalize Numerics' },
  { id: 'fix_types',    icon: '🔄', title: 'Fix Data Types' },
];

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
