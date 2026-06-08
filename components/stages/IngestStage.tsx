'use client';

import { useRef } from 'react';
import { DataRow } from '@/lib/types';
import { SAMPLE_DATASETS } from '@/lib/samples';
import { inferTypes } from '@/lib/dataUtils';

interface IngestStageProps {
  onIngest: (headers: string[], rows: DataRow[], filename: string) => void;
  logs: string[];
  hasData: boolean;
  rowCount: number;
  colCount: number;
  onProceed: () => void;
}

export default function IngestStage({ onIngest, logs, hasData, rowCount, colCount, onProceed }: IngestStageProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const pasteRef = useRef<HTMLTextAreaElement>(null);

  function handleFile(file: File) {
    if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          let data = JSON.parse(e.target?.result as string);
          if (!Array.isArray(data)) data = [data];
          const headers = Object.keys(data[0] || {});
          onIngest(headers, data, file.name);
        } catch {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    } else {
      // dynamic import for browser only
      import('papaparse').then(({ default: Papa }) => {
        Papa.parse(file as any, {
          header: true, skipEmptyLines: true, dynamicTyping: true,
          complete: (r: any) => {
            onIngest(r.meta.fields || [], r.data, file.name);
          },
        });
      });
    }
  }

  function parsePasted() {
    const text = pasteRef.current?.value.trim();
    if (!text) return;
    import('papaparse').then(({ default: Papa }) => {
      const r = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: true });
      onIngest(r.meta.fields as string[], r.data as DataRow[], 'pasted_data.csv');
    });
  }

  function loadSample(name: string) {
    const ds = SAMPLE_DATASETS[name]();
    onIngest(ds.headers, ds.rows, `${name}_sample.csv`);
  }

  const SAMPLES = [
    { id: 'sales',   icon: '🛒', label: 'Sales Analytics',  desc: 'Monthly sales, regions, revenue & margins (60 rows)', color: 'cyan' },
    { id: 'hr',      icon: '👥', label: 'HR Dataset',        desc: 'Employees, departments, salaries & performance (50 rows)', color: 'violet' },
    { id: 'finance', icon: '💰', label: 'Financial KPIs',    desc: 'Quarterly P&L, EBITDA, budgets & YoY growth (40 rows)', color: 'amber' },
  ];

  return (
    <div className="stage-content">
      <div className="stage-header">
        <h1 className="stage-title"><span>⬆</span> Data Ingestion</h1>
        <p className="stage-sub">Upload a CSV/JSON file, paste raw data, or choose a built-in sample dataset.</p>
      </div>

      <div className="two-col">
        {/* Left — upload */}
        <div className="col-stack">
          {/* Drop zone */}
          <div className="card">
            <div
              className="drop-zone"
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
              onDragLeave={e => e.currentTarget.classList.remove('drag-over')}
              onDrop={e => {
                e.preventDefault();
                e.currentTarget.classList.remove('drag-over');
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
            >
              <input ref={fileRef} type="file" accept=".csv,.json,.tsv" style={{ display: 'none' }}
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
              <div className="drop-icon">📂</div>
              <div className="drop-title">Drop your file here</div>
              <div className="drop-sub">CSV · TSV · JSON · up to 10 MB</div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }}>Browse Files</button>
            </div>
          </div>

          {/* Paste */}
          <div className="card">
            <div className="card-label">Paste Raw CSV</div>
            <textarea ref={pasteRef} className="paste-area"
              placeholder={`name,age,salary\nAlice,30,75000\nBob,25,62000`} />
            <div style={{ marginTop: 10 }}>
              <button className="btn btn-secondary btn-sm" onClick={parsePasted}>⚡ Parse Text</button>
            </div>
          </div>
        </div>

        {/* Right — samples + log */}
        <div className="col-stack">
          <div className="card">
            <div className="card-label">Sample Datasets</div>
            <div className="sample-grid">
              {SAMPLES.map(s => (
                <div key={s.id} className={`sample-card sample-${s.color}`} onClick={() => loadSample(s.id)}>
                  <div className={`sample-badge badge-${s.color}`}>{s.id.charAt(0).toUpperCase() + s.id.slice(1)}</div>
                  <h4>{s.icon} {s.label}</h4>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-label">Ingestion Log</div>
            <div className="ingest-log">
              {logs.length === 0
                ? <span style={{ color: 'var(--text-muted)' }}>» Waiting for data source...</span>
                : logs.map((l, i) => <div key={i} className="log-line">{l}</div>)
              }
            </div>
            {hasData && (
              <div className="ingest-footer">
                <span className="ingest-summary">{rowCount} rows × {colCount} cols</span>
                <button className="btn btn-primary" onClick={onProceed}>Continue to Store →</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
