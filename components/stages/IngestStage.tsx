'use client';

import { useRef, useState } from 'react';
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
  onError: (msg: string) => void;
}

export default function IngestStage({ onIngest, logs, hasData, rowCount, colCount, onProceed, onError }: IngestStageProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const pasteRef = useRef<HTMLTextAreaElement>(null);
  const [apiUrl, setApiUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [showModal, setShowModal] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (file.size === 0) {
      onError(`Security: File "${file.name}" is empty (0 bytes).`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      onError(`Security: File "${file.name}" exceeds the 10MB size limit.`);
      return;
    }

    const allowedMimes = ['text/csv', 'application/json', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/tab-separated-values'];
    if (!allowedMimes.includes(file.type) && !file.name.match(/\.(csv|json|xlsx|xls|tsv)$/i)) {
      onError(`Security: Invalid or dangerous file type detected (${file.type}).`);
      return;
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');

    setIsFetching(true);
    await new Promise(r => setTimeout(r, 800)); // simulated malware scan
    setIsFetching(false);

    if (safeName.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          let data = JSON.parse(e.target?.result as string);
          if (!Array.isArray(data)) data = [data];
          if (!data[0] || typeof data[0] !== 'object') throw new Error('JSON array must contain objects');
          const headers = Object.keys(data[0] || {});
          onIngest(headers, data, safeName);
        } catch (err: any) {
          onError(`Failed to parse JSON: ${err.message}`);
        }
      };
      reader.readAsText(file);
    } else if (safeName.endsWith('.xlsx') || safeName.endsWith('.xls')) {
      import('xlsx').then(XLSX => {
        const reader = new FileReader();
        reader.onload = e => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json<DataRow>(sheet);
            if (!json.length) throw new Error('Excel sheet is empty');
            const headers = Object.keys(json[0]);
            onIngest(headers, json, safeName);
          } catch (err: any) {
            onError(`Failed to parse Excel: ${err.message}`);
          }
        };
        reader.readAsArrayBuffer(file);
      }).catch(() => onError('Failed to load Excel parser'));
    } else {
      import('papaparse').then(({ default: Papa }) => {
        Papa.parse(file as any, {
          header: true, skipEmptyLines: true, dynamicTyping: true,
          complete: (r: any) => {
            if (r.errors && r.errors.length > 0) {
              // Show the first error if the file is fundamentally corrupt
              if (r.errors[0].type === 'Delimiter' || r.errors[0].code === 'UndetectableDelimiter') {
                return onError(`Corrupt CSV File: ${r.errors[0].message}`);
              }
              console.error('PapaParse Warnings:', r.errors);
            }
            if (!r.data || !r.data.length) return onError('CSV file is empty or invalid structure');
            
            // XSS Basic Sanitization
            const cleanData = r.data.map((row: any) => {
              const safeRow: any = {};
              for (const key in row) {
                if (typeof row[key] === 'string') {
                  safeRow[key] = row[key].replace(/</g, '&lt;').replace(/>/g, '&gt;');
                } else {
                  safeRow[key] = row[key];
                }
              }
              return safeRow;
            });
            onIngest(r.meta.fields || [], cleanData, safeName);
          },
          error: (err: any) => onError(`PapaParse error: ${err.message}`)
        });
      }).catch(() => onError('Failed to load CSV parser'));
    }
  }

  function parsePasted() {
    const text = pasteRef.current?.value.trim();
    if (!text) return;
    import('papaparse').then(({ default: Papa }) => {
      const r = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: true });
      onIngest(r.meta.fields as string[], r.data as DataRow[], 'pasted_data.csv');
      setShowModal(null);
    });
  }

  async function fetchFromApi() {
    if (!apiUrl) return;
    setIsFetching(true);
    try {
      const res = await fetch('/api/fetch-remote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: apiUrl })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `HTTP Error ${res.status}`);
      }
      let payload = await res.json();
      let data = payload.data;
      
      if (payload.type === 'text') {
        import('papaparse').then(({ default: Papa }) => {
          const r = Papa.parse(data, { header: true, skipEmptyLines: true, dynamicTyping: true });
          onIngest(r.meta.fields as string[], r.data as DataRow[], new URL(apiUrl).hostname || 'api_data');
          setApiUrl('');
          setShowModal(null);
          setIsFetching(false);
        });
        return;
      }

      if (!Array.isArray(data)) data = [data];
      if (!data[0] || typeof data[0] !== 'object') throw new Error('API response must be a JSON array of objects');
      const headers = Object.keys(data[0]);
      onIngest(headers, data, new URL(apiUrl).hostname || 'api_data');
      setApiUrl('');
      setShowModal(null);
    } catch (err: any) {
      onError(`Security/API Error: ${err.message}`);
    } finally {
      setIsFetching(false);
    }
  }

  function connectMockDB(dbName: string) {
    onError(`Direct connections to ${dbName} are simulated in this browser MVP.`);
    loadSample('sales');
    setShowModal(null);
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
        <h1 className="stage-title"><span>⬆</span> Integration Hub (Extract)</h1>
        <p className="stage-sub">Connect to Enterprise databases, APIs, or upload local files to begin ELT.</p>
      </div>

      <div className="two-col">
        {/* Left — Connectors */}
        <div className="col-stack">
          <div className="card">
            <div className="card-label">Enterprise Connectors</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
              <button className="btn btn-secondary" style={{ flexDirection: 'column', padding: '20px' }} onClick={() => setShowModal('postgres')}>
                <span style={{ fontSize: '24px', marginBottom: '8px' }}>🐘</span> PostgreSQL
              </button>
              <button className="btn btn-secondary" style={{ flexDirection: 'column', padding: '20px' }} onClick={() => setShowModal('snowflake')}>
                <span style={{ fontSize: '24px', marginBottom: '8px' }}>❄️</span> Snowflake
              </button>
              <button className="btn btn-secondary" style={{ flexDirection: 'column', padding: '20px' }} onClick={() => setShowModal('bigquery')}>
                <span style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</span> BigQuery
              </button>
              <button className="btn btn-secondary" style={{ flexDirection: 'column', padding: '20px' }} onClick={() => setShowModal('s3')}>
                <span style={{ fontSize: '24px', marginBottom: '8px' }}>🪣</span> AWS S3
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-label">Local & APIs</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>📂 Upload File</button>
              <button className="btn btn-secondary" onClick={() => setShowModal('api')}>🌐 REST API</button>
              <button className="btn btn-secondary" onClick={() => setShowModal('paste')}>📝 Paste CSV</button>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.tsv,.json,.xlsx,.xls" style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
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
                <button className="btn btn-primary" onClick={onProceed}>Continue to Transform →</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connection Modals */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ minWidth: 400 }}>
            {['postgres', 'snowflake', 'bigquery', 's3'].includes(showModal) && (
              <>
                <h2 style={{ marginBottom: 16, textTransform: 'capitalize' }}>Connect to {showModal}</h2>
                <input type="text" placeholder="Host / URL" className="search-input" style={{ width: '100%', marginBottom: 12 }} />
                <input type="text" placeholder="Port" className="search-input" style={{ width: '100%', marginBottom: 12 }} />
                <input type="text" placeholder="Username" className="search-input" style={{ width: '100%', marginBottom: 12 }} />
                <input type="password" placeholder="Password" className="search-input" style={{ width: '100%', marginBottom: 12 }} />
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="ssl-toggle" />
                  <label htmlFor="ssl-toggle" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Require SSL/TLS Encryption</label>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sync Frequency</label>
                  <select className="search-input" style={{ width: '100%', marginTop: '4px' }}>
                    <option>Manual (Run Once)</option>
                    <option>Hourly</option>
                    <option>Daily at Midnight</option>
                  </select>
                </div>
                <div className="flex gap-8" style={{ justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => setShowModal(null)}>Cancel</button>
                  <button className="btn btn-primary" onClick={() => {
                    const sslToggle = document.getElementById('ssl-toggle') as HTMLInputElement;
                    if (!sslToggle?.checked) {
                      onError('Security: Enterprise connections require SSL/TLS encryption.');
                      return;
                    }
                    connectMockDB(showModal);
                  }}>Test & Connect</button>
                </div>
              </>
            )}

            {showModal === 'api' && (
              <>
                <h2 style={{ marginBottom: 16 }}>Fetch from REST API</h2>
                <input type="text" placeholder="https://api.example.com/data.json" className="search-input" style={{ width: '100%', marginBottom: 20 }} value={apiUrl} onChange={e => setApiUrl(e.target.value)} />
                <div className="flex gap-8" style={{ justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => setShowModal(null)}>Cancel</button>
                  <button className="btn btn-primary" onClick={fetchFromApi} disabled={isFetching}>{isFetching ? 'Fetching...' : 'Fetch'}</button>
                </div>
              </>
            )}

            {showModal === 'paste' && (
              <>
                <h2 style={{ marginBottom: 16 }}>Paste Raw CSV</h2>
                <textarea ref={pasteRef} className="paste-area" style={{ height: '150px', marginBottom: 20 }} placeholder="name,age\nAlice,30\nBob,25" />
                <div className="flex gap-8" style={{ justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => setShowModal(null)}>Cancel</button>
                  <button className="btn btn-primary" onClick={parsePasted}>Parse Data</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
