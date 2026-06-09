const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'components/stages/IngestStage.tsx');

const newContent = `
'use client';

import { useRef, useState } from 'react';
import { DataRow } from '@/lib/types';
import { SAMPLE_DATASETS } from '@/lib/samples';

interface IngestStageProps {
  onIngest: (headers: string[], rows: DataRow[], filename: string, type: 'csv'|'api'|'pdf'|'db') => void;
  logs: string[];
  hasData: boolean;
  datasets: any[];
  onProceed: () => void;
  onError: (msg: string) => void;
}

export default function IngestStage({ onIngest, logs, hasData, datasets, onProceed, onError }: IngestStageProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const pasteRef = useRef<HTMLTextAreaElement>(null);
  const [activeTab, setActiveTab] = useState<'enterprise' | 'local' | 'samples'>('local');

  function handleFile(file: File) {
    if (!file) return;
    const safeName = file.name.replace(/[^a-zA-Z0-9.\\-_]/g, '');
    import('papaparse').then(({ default: Papa }) => {
      Papa.parse(file as any, {
        header: true, skipEmptyLines: true, dynamicTyping: true,
        complete: (r: any) => {
          if (!r.data || !r.data.length) return onError('CSV file is empty');
          onIngest(r.meta.fields || [], r.data, safeName, 'csv');
        }
      });
    });
  }

  async function mockPDFParse() {
    const mockHeaders = ['DocumentId', 'ExtractedText', 'ConfidenceScore', 'PageNumber'];
    const mockRows = [{ DocumentId: 'DOC_001', ExtractedText: 'Q3 Earnings Report summary...', ConfidenceScore: 0.98, PageNumber: 1 }];
    onIngest(mockHeaders, mockRows, 'extracted_documents.pdf', 'pdf');
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', color: 'var(--text-primary)', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Top Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'inline-block', background: 'rgba(99,102,241,0.15)', color: 'var(--accent)', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, marginBottom: '16px' }}>
          Step 1 of 5 · Extract
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0' }}>Integration Hub</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px' }}>
          Connect a source to begin ingestion. All data is encrypted and consent-stamped on arrival.
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '8px' }}>SOURCES CONNECTED</div>
          <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>3</div>
          <div style={{ color: 'var(--emerald)', fontSize: '12px', fontWeight: 500 }}>+1 this session</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '8px' }}>RECORDS INGESTED</div>
          <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>394k</div>
          <div style={{ color: 'var(--emerald)', fontSize: '12px', fontWeight: 500 }}>Last: 2 min ago</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '8px' }}>QUARANTINED</div>
          <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px', color: 'var(--amber)' }}>17</div>
          <div style={{ color: 'var(--amber)', fontSize: '12px', fontWeight: 500 }}>Review required</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
        <div style={{ padding: '0 0 12px 0', color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer' }}>Enterprise connectors</div>
        <div style={{ padding: '0 0 12px 0', color: 'var(--accent)', borderBottom: '2px solid var(--accent)', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>Local & APIs</div>
        <div style={{ padding: '0 0 12px 0', color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer' }}>Sample datasets</div>
      </div>

      {/* Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '40px' }}>
        
        {/* Card 1 */}
        <div 
          onClick={() => fileRef.current?.click()}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', cursor: 'pointer', position: 'relative' }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(99,102,241,0.1)', borderRadius: '8px' }}></div>
            <div style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Recommended</div>
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' }}>Upload file</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            CSV, Parquet, JSON, Excel. Auto-detects schema and flags PII columns.
          </p>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Encrypted on upload</div>
          <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(f => handleFile(f)); }} />
        </div>

        {/* Card 2 */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(6,182,212,0.1)', borderRadius: '8px' }}></div>
            <div style={{ background: 'rgba(6,182,212,0.15)', color: 'var(--cyan)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>REST / GraphQL</div>
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' }}>REST API</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            Connect any HTTP endpoint. Bearer token, OAuth 2.0, or API key auth.
          </p>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Supports polling schedules</div>
        </div>

        {/* Card 3 */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px' }}></div>
            <div style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--emerald)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Paste</div>
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' }}>Paste CSV</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            Quick ingest for small datasets. Paste raw text, AETHER parses structure instantly.
          </p>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Instant preview</div>
        </div>

        {/* Card 4 */}
        <div onClick={mockPDFParse} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(245,158,11,0.1)', borderRadius: '8px' }}></div>
            <div style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--amber)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>OCR</div>
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' }}>Parse PDF</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            Extract structured data from PDFs via OCR. Tables, forms, and text blocks detected.
          </p>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>~8s per page</div>
        </div>

        {/* Card 5 */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(245,158,11,0.1)', borderRadius: '8px' }}></div>
            <div style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--amber)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Streaming</div>
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' }}>Kafka stream</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            Subscribe to a Kafka topic. Real-time ingestion with exactly-once delivery guarantee.
          </p>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Live feed</div>
        </div>

        {/* Card 6 */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', opacity: 0.5, cursor: 'not-allowed' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}></div>
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' }}>More connectors</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            Snowflake, BigQuery, S3, Postgres — in Enterprise tier
          </p>
        </div>

      </div>

      {/* Ingestion Log */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--emerald)' }}></div>
            <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '1px', color: 'var(--text-secondary)' }}>INGESTION LOG</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}>Clear</div>
        </div>
        
        <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: '60px', color: 'var(--text-muted)', fontSize: '13px' }}>09:41</div>
            <div style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
              <strong>sales_q1.csv</strong> — 12,440 rows ingested · schema inferred · 2 PII columns flagged
            </div>
          </div>
          <div style={{ display: 'flex', padding: '16px 0' }}>
            <div style={{ width: '60px', color: 'var(--text-muted)', fontSize: '13px' }}>09:38</div>
            <div style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
              <strong>users_export.json</strong> — 17 records quarantined · missing required field <strong>consent_ts</strong>
            </div>
          </div>
          {datasets.map((ds, idx) => (
             <div key={idx} style={{ display: 'flex', padding: '16px 0', borderTop: '1px solid var(--border)' }}>
                <div style={{ width: '60px', color: 'var(--emerald)', fontSize: '13px' }}>Just now</div>
                <div style={{ color: 'var(--emerald)', fontSize: '13px' }}>
                  <strong>{ds.name}</strong> — Successfully ingested and added to active pipeline.
                </div>
             </div>
          ))}
        </div>
      </div>

      {hasData && (
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onProceed}>Continue to Pipeline →</button>
        </div>
      )}

    </div>
  );
}
\`;

fs.writeFileSync(targetFile, newContent);
console.log('IngestStage strict refactor completed.');
`;

fs.writeFileSync(path.join(__dirname, 'scratch_refactor_ingest_strict.js'), newScript);
