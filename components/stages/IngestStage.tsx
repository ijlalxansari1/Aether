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

  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  


  const [showSfModal, setShowSfModal] = useState(false);
  const [sfAccount, setSfAccount] = useState('');
  const [sfUser, setSfUser] = useState('');
  const [sfPassword, setSfPassword] = useState('');
  const [sfDatabase, setSfDatabase] = useState('');
  const [sfWarehouse, setSfWarehouse] = useState('');
  const [sfSchema, setSfSchema] = useState('PUBLIC');
  const [sfRole, setSfRole] = useState('');
  const [sfQuery, setSfQuery] = useState('SELECT * FROM my_table LIMIT 100');
  const [sfLoading, setSfLoading] = useState(false);



  const [showKafkaModal, setShowKafkaModal] = useState(false);
  const [kafkaBrokers, setKafkaBrokers] = useState('localhost:9092');
  const [kafkaTopic, setKafkaTopic] = useState('events');
  const [kafkaGroupId, setKafkaGroupId] = useState('aether-group');
  const [kafkaLoading, setKafkaLoading] = useState(false);

  const [showS3Modal, setShowS3Modal] = useState(false);
  const [s3AccessKey, setS3AccessKey] = useState('');
  const [s3SecretKey, setS3SecretKey] = useState('');
  const [s3Region, setS3Region] = useState('us-east-1');
  const [s3Bucket, setS3Bucket] = useState('');
  const [s3Key, setS3Key] = useState('');
  const [s3Loading, setS3Loading] = useState(false);

  const [showBqModal, setShowBqModal] = useState(false);
  const [bqProjectId, setBqProjectId] = useState('');
  const [bqClientEmail, setBqClientEmail] = useState('');
  const [bqPrivateKey, setBqPrivateKey] = useState('');
  const [bqQuery, setBqQuery] = useState('SELECT * FROM `my-project.my_dataset.my_table` LIMIT 100');
  const [bqLoading, setBqLoading] = useState(false);

  const [showPgModal, setShowPgModal] = useState(false);
  const [pgHost, setPgHost] = useState('localhost');
  const [pgPort, setPgPort] = useState('5432');
  const [pgUser, setPgUser] = useState('postgres');
  const [pgPassword, setPgPassword] = useState('');
  const [pgDatabase, setPgDatabase] = useState('postgres');
  const [pgQuery, setPgQuery] = useState('SELECT * FROM users LIMIT 100');
  const [pgLoading, setPgLoading] = useState(false);

  const [showRestModal, setShowRestModal] = useState(false);
  const [restUrl, setRestUrl] = useState('');
  const [restMethod, setRestMethod] = useState('GET');
  const [restHeaders, setRestHeaders] = useState('{\n  "Authorization": "Bearer YOUR_TOKEN"\n}');

  const fileRef = useRef<HTMLInputElement>(null);
  const pasteRef = useRef<HTMLTextAreaElement>(null);
  const [activeTab, setActiveTab] = useState<'enterprise' | 'local' | 'samples'>('local');


  function handlePasteSubmit() {
    if (!pasteText.trim()) return;
    try {
      const lines = pasteText.trim().split('\n');
      if (lines.length < 2) throw new Error('Need at least header and one data row');
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim());
        const row: Record<string, any> = {};
        headers.forEach((h, i) => {
          row[h] = isNaN(Number(vals[i])) ? vals[i] : Number(vals[i]);
        });
        return row;
      });
      onIngest(headers, rows, 'Pasted_Data.csv', 'csv');
      setShowPasteModal(false);
      setPasteText('');
    } catch (err: any) {
      onError('Failed to parse pasted CSV: ' + err.message);
    }
  }

  async function handleRestSubmit() {
    if (!restUrl.trim()) return;
    try {
      const parsedHeaders = JSON.parse(restHeaders || '{}');
      const res = await fetch(restUrl, {
        method: restMethod,
        headers: parsedHeaders,
      });
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (data.data || data.items || [data]);
      if (arr.length === 0) throw new Error('API returned empty array');
      
      const headers = Object.keys(arr[0]);
      const rows = arr.map((item: any) => {
        const row: Record<string, any> = {};
        headers.forEach(h => {
          row[h] = typeof item[h] === 'object' ? JSON.stringify(item[h]) : item[h];
        });
        return row;
      });
      
      onIngest(headers, rows, new URL(restUrl).pathname.split('/').pop() || 'API_Data', 'api');
      setShowRestModal(false);
    } catch (err: any) {
      onError('Failed to fetch from API: ' + err.message);
    }
  }

  async function handlePgSubmit() {
    setPgLoading(true);
    try {
      const res = await fetch('/api/ingest/postgres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: pgHost, port: pgPort, user: pgUser, password: pgPassword, database: pgDatabase, query: pgQuery
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Database error');
      if (data.data.length === 0) throw new Error('Query returned 0 rows');
      
      const headers = data.fields || Object.keys(data.data[0]);
      onIngest(headers, data.data, `pg_${pgDatabase}.csv`, 'db');
      setShowPgModal(false);
    } catch (err: any) {
      onError('Postgres Error: ' + err.message);
    } finally {
      setPgLoading(false);
    }
  }

  async function handleSfSubmit() {
    setSfLoading(true);
    try {
      const res = await fetch('/api/ingest/snowflake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: sfAccount, username: sfUser, password: sfPassword, 
          database: sfDatabase, warehouse: sfWarehouse, schema: sfSchema, role: sfRole, query: sfQuery
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Database error');
      if (data.data.length === 0) throw new Error('Query returned 0 rows');
      
      const headers = data.fields || Object.keys(data.data[0]);
      onIngest(headers, data.data, `snowflake_${sfDatabase}.csv`, 'db');
      setShowSfModal(false);
    } catch (err: any) {
      onError('Snowflake Error: ' + err.message);
    } finally {
      setSfLoading(false);
    }
  }

  async function handleBqSubmit() {
    setBqLoading(true);
    try {
      const res = await fetch('/api/ingest/bigquery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: bqProjectId, clientEmail: bqClientEmail, privateKey: bqPrivateKey, query: bqQuery
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Database error');
      if (data.data.length === 0) throw new Error('Query returned 0 rows');
      
      const headers = data.fields || Object.keys(data.data[0]);
      onIngest(headers, data.data, `bigquery_${bqProjectId}.csv`, 'db');
      setShowBqModal(false);
    } catch (err: any) {
      onError('BigQuery Error: ' + err.message);
    } finally {
      setBqLoading(false);
    }
  }

  async function handleS3Submit() {
    setS3Loading(true);
    try {
      const res = await fetch('/api/ingest/s3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessKeyId: s3AccessKey, secretAccessKey: s3SecretKey, region: s3Region, bucket: s3Bucket, key: s3Key
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Database error');
      if (data.data.length === 0) throw new Error('File returned 0 rows');
      
      const headers = data.fields || Object.keys(data.data[0]);
      onIngest(headers, data.data, s3Key.split('/').pop() || 's3_data.csv', 'db');
      setShowS3Modal(false);
    } catch (err: any) {
      onError('S3 Error: ' + err.message);
    } finally {
      setS3Loading(false);
    }
  }

  async function handleKafkaSubmit() {
    setKafkaLoading(true);
    try {
      const res = await fetch('/api/ingest/kafka', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brokers: kafkaBrokers, topic: kafkaTopic, groupId: kafkaGroupId
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Connection error');
      if (data.data.length === 0) throw new Error('Topic returned 0 JSON messages in the sampling window (3s)');
      
      const headers = data.fields || Object.keys(data.data[0]);
      onIngest(headers, data.data, `kafka_${kafkaTopic}.csv`, 'db');
      setShowKafkaModal(false);
    } catch (err: any) {
      onError('Kafka Error: ' + err.message);
    } finally {
      setKafkaLoading(false);
    }
  }


  function handleFile(file: File) {
    if (!file) return;
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
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
        <div 
          onClick={() => setActiveTab('enterprise')}
          style={{ padding: '0 0 12px 0', color: activeTab === 'enterprise' ? 'var(--accent)' : 'var(--text-secondary)', borderBottom: activeTab === 'enterprise' ? '2px solid var(--accent)' : 'none', fontSize: '14px', fontWeight: activeTab === 'enterprise' ? 500 : 400, cursor: 'pointer' }}
        >
          Cloud & databases
        </div>
        <div 
          onClick={() => setActiveTab('local')}
          style={{ padding: '0 0 12px 0', color: activeTab === 'local' ? 'var(--accent)' : 'var(--text-secondary)', borderBottom: activeTab === 'local' ? '2px solid var(--accent)' : 'none', fontSize: '14px', fontWeight: activeTab === 'local' ? 500 : 400, cursor: 'pointer' }}
        >
          Local & APIs
        </div>
        <div 
          onClick={() => setActiveTab('samples')}
          style={{ padding: '0 0 12px 0', color: activeTab === 'samples' ? 'var(--accent)' : 'var(--text-secondary)', borderBottom: activeTab === 'samples' ? '2px solid var(--accent)' : 'none', fontSize: '14px', fontWeight: activeTab === 'samples' ? 500 : 400, cursor: 'pointer' }}
        >
          Sample datasets
        </div>
      </div>

      {activeTab === 'enterprise' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '40px' }}>
          
          <div onClick={() => setShowSfModal(true)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}
               onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(56,189,248,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>❄️</div>
              <div style={{ background: 'rgba(56,189,248,0.15)', color: 'var(--sky)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Data Warehouse</div>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' }}>Snowflake</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Native integration. Pull live data or run push-down queries directly in Snowflake compute.
            </p>
          </div>

          <div onClick={() => setShowBqModal(true)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}
               onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🔍</div>
              <div style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--rose)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Google Cloud</div>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' }}>BigQuery</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              High-performance streaming. Synchronize massive datasets instantaneously without exiting Aether.
            </p>
          </div>

          <div onClick={() => setShowS3Modal(true)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}
               onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(245,158,11,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>☁️</div>
              <div style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--amber)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Object Storage</div>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' }}>AWS S3</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Batch process millions of files. Parquet, Avro, and JSON optimized readers built-in.
            </p>
          </div>

          <div onClick={() => setShowPgModal(true)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}
               onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🐘</div>
              <div style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--emerald)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Relational</div>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' }}>PostgreSQL</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Direct connection to production databases. Read-replica support standard.
            </p>
          </div>

        </div>
      )}

      {activeTab === 'samples' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          {Object.values(SAMPLE_DATASETS).map(fn => fn()).map((s, idx) => (
            <div 
              key={idx}
              onClick={() => onIngest(s.headers, s.rows, s.name, 'csv')}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 8px 0' }}>{s.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                {s.rows.length} rows · Pre-cleaned dataset for testing
              </p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'local' && (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '40px' }}>
        {/* Cards Grid */}
        
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
        <div onClick={() => setShowRestModal(true)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}>
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
        <div onClick={() => setShowPasteModal(true)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}>
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
        <div onClick={() => setShowKafkaModal(true)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}
               onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(245,158,11,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>⚡</div>
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
            Snowflake, BigQuery, S3, Postgres — 100% Free, coming soon.
          </p>
        </div>

      </div>
      )}




      {/* Snowflake Modal */}
      {showSfModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ minWidth: '600px', background: 'var(--bg-surface)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 24 }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(56,189,248,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>❄️</div>
              <h2 style={{ margin: 0 }}>Connect to Snowflake</h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Account</label>
                <input type="text" value={sfAccount} onChange={e => setSfAccount(e.target.value)} placeholder="xy12345.us-east-1" className="search-input" style={{ width: '100%', padding: '8px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Database</label>
                <input type="text" value={sfDatabase} onChange={e => setSfDatabase(e.target.value)} className="search-input" style={{ width: '100%', padding: '8px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Warehouse</label>
                <input type="text" value={sfWarehouse} onChange={e => setSfWarehouse(e.target.value)} className="search-input" style={{ width: '100%', padding: '8px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Schema</label>
                <input type="text" value={sfSchema} onChange={e => setSfSchema(e.target.value)} className="search-input" style={{ width: '100%', padding: '8px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>User</label>
                <input type="text" value={sfUser} onChange={e => setSfUser(e.target.value)} className="search-input" style={{ width: '100%', padding: '8px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Role (Optional)</label>
                <input type="text" value={sfRole} onChange={e => setSfRole(e.target.value)} className="search-input" style={{ width: '100%', padding: '8px' }} />
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Password</label>
              <input type="password" value={sfPassword} onChange={e => setSfPassword(e.target.value)} className="search-input" style={{ width: '100%', padding: '8px' }} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>SQL Query</label>
              <textarea value={sfQuery} onChange={e => setSfQuery(e.target.value)} className="search-input" style={{ width: '100%', height: '80px', padding: '12px', fontFamily: 'monospace' }} />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-sm" onClick={() => setShowSfModal(false)} style={{ background: 'transparent', color: 'var(--text-secondary)' }}>Cancel</button>
              <button className="btn btn-sm btn-primary" onClick={handleSfSubmit} disabled={sfLoading}>
                {sfLoading ? 'Connecting...' : 'Run Query & Ingest'}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Kafka Modal */}
      {showKafkaModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ minWidth: '600px', background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 24 }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(245,158,11,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>⚡</div>
              <h2 style={{ margin: 0 }}>Connect to Kafka</h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Brokers (comma-separated)</label>
                <input type="text" value={kafkaBrokers} onChange={e => setKafkaBrokers(e.target.value)} placeholder="localhost:9092, broker2:9092" className="search-input" style={{ width: '100%', padding: '8px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Topic</label>
                <input type="text" value={kafkaTopic} onChange={e => setKafkaTopic(e.target.value)} placeholder="user-events" className="search-input" style={{ width: '100%', padding: '8px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Consumer Group ID</label>
                <input type="text" value={kafkaGroupId} onChange={e => setKafkaGroupId(e.target.value)} className="search-input" style={{ width: '100%', padding: '8px' }} />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn btn-sm" onClick={() => setShowKafkaModal(false)} style={{ background: 'transparent', color: 'var(--text-secondary)' }}>Cancel</button>
              <button className="btn btn-sm btn-primary" onClick={handleKafkaSubmit} disabled={kafkaLoading}>
                {kafkaLoading ? 'Consuming Stream...' : 'Subscribe & Ingest'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AWS S3 Modal */}
      {showS3Modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ minWidth: '600px', background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 24 }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(245,158,11,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>☁️</div>
              <h2 style={{ margin: 0 }}>Connect to AWS S3</h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Region</label>
                <input type="text" value={s3Region} onChange={e => setS3Region(e.target.value)} placeholder="us-east-1" className="search-input" style={{ width: '100%', padding: '8px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Bucket Name</label>
                <input type="text" value={s3Bucket} onChange={e => setS3Bucket(e.target.value)} className="search-input" style={{ width: '100%', padding: '8px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Access Key ID</label>
                <input type="text" value={s3AccessKey} onChange={e => setS3AccessKey(e.target.value)} className="search-input" style={{ width: '100%', padding: '8px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Secret Access Key</label>
                <input type="password" value={s3SecretKey} onChange={e => setS3SecretKey(e.target.value)} className="search-input" style={{ width: '100%', padding: '8px' }} />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Object Key (File Path)</label>
              <input type="text" value={s3Key} onChange={e => setS3Key(e.target.value)} placeholder="data/users_export.csv" className="search-input" style={{ width: '100%', padding: '8px' }} />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Only .csv files are supported in this MVP version.</div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-sm" onClick={() => setShowS3Modal(false)} style={{ background: 'transparent', color: 'var(--text-secondary)' }}>Cancel</button>
              <button className="btn btn-sm btn-primary" onClick={handleS3Submit} disabled={s3Loading}>
                {s3Loading ? 'Connecting...' : 'Fetch CSV & Ingest'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BigQuery Modal */}
      {showBqModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ minWidth: '600px', background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 24 }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🔍</div>
              <h2 style={{ margin: 0 }}>Connect to BigQuery</h2>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Project ID</label>
              <input type="text" value={bqProjectId} onChange={e => setBqProjectId(e.target.value)} className="search-input" style={{ width: '100%', padding: '8px' }} />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Client Email</label>
              <input type="text" value={bqClientEmail} onChange={e => setBqClientEmail(e.target.value)} className="search-input" style={{ width: '100%', padding: '8px' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Private Key</label>
              <textarea value={bqPrivateKey} onChange={e => setBqPrivateKey(e.target.value)} placeholder="-----BEGIN PRIVATE KEY-----\n..." className="search-input" style={{ width: '100%', height: '80px', padding: '8px', fontFamily: 'monospace' }} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>SQL Query</label>
              <textarea value={bqQuery} onChange={e => setBqQuery(e.target.value)} className="search-input" style={{ width: '100%', height: '80px', padding: '12px', fontFamily: 'monospace' }} />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-sm" onClick={() => setShowBqModal(false)} style={{ background: 'transparent', color: 'var(--text-secondary)' }}>Cancel</button>
              <button className="btn btn-sm btn-primary" onClick={handleBqSubmit} disabled={bqLoading}>
                {bqLoading ? 'Connecting...' : 'Run Query & Ingest'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Postgres Modal */}
      {showPgModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ minWidth: '600px', background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 24 }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🐘</div>
              <h2 style={{ margin: 0 }}>Connect to PostgreSQL</h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Host</label>
                <input type="text" value={pgHost} onChange={e => setPgHost(e.target.value)} className="search-input" style={{ width: '100%', padding: '8px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Port</label>
                <input type="text" value={pgPort} onChange={e => setPgPort(e.target.value)} className="search-input" style={{ width: '100%', padding: '8px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Database</label>
                <input type="text" value={pgDatabase} onChange={e => setPgDatabase(e.target.value)} className="search-input" style={{ width: '100%', padding: '8px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>User</label>
                <input type="text" value={pgUser} onChange={e => setPgUser(e.target.value)} className="search-input" style={{ width: '100%', padding: '8px' }} />
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Password</label>
              <input type="password" value={pgPassword} onChange={e => setPgPassword(e.target.value)} className="search-input" style={{ width: '100%', padding: '8px' }} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>SQL Query</label>
              <textarea value={pgQuery} onChange={e => setPgQuery(e.target.value)} className="search-input" style={{ width: '100%', height: '80px', padding: '12px', fontFamily: 'monospace' }} />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-sm" onClick={() => setShowPgModal(false)} style={{ background: 'transparent', color: 'var(--text-secondary)' }}>Cancel</button>
              <button className="btn btn-sm btn-primary" onClick={handlePgSubmit} disabled={pgLoading}>
                {pgLoading ? 'Connecting...' : 'Run Query & Ingest'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paste Modal */}
      {showPasteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ minWidth: '600px', background: 'var(--bg-surface)' }}>
            <h2 style={{ marginBottom: 16 }}>Paste CSV Data</h2>
            <textarea 
              placeholder="id,name,age\n1,Alice,24\n2,Bob,30" 
              value={pasteText} 
              onChange={e => setPasteText(e.target.value)} 
              className="search-input" 
              style={{ width: '100%', height: '200px', marginBottom: 20, padding: '12px', fontFamily: 'monospace' }} 
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-sm" onClick={() => setShowPasteModal(false)} style={{ background: 'transparent', color: 'var(--text-secondary)' }}>Cancel</button>
              <button className="btn btn-sm btn-primary" onClick={handlePasteSubmit}>Parse & Ingest</button>
            </div>
          </div>
        </div>
      )}

      {/* REST API Modal */}
      {showRestModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ minWidth: '600px', background: 'var(--bg-surface)' }}>
            <h2 style={{ marginBottom: 16 }}>Connect REST API</h2>
            
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <select value={restMethod} onChange={e => setRestMethod(e.target.value)} className="search-input" style={{ width: '100px', padding: '8px' }}>
                <option>GET</option><option>POST</option>
              </select>
              <input 
                type="text" 
                placeholder="https://api.example.com/data" 
                value={restUrl} 
                onChange={e => setRestUrl(e.target.value)} 
                className="search-input" 
                style={{ flex: 1, padding: '8px' }} 
              />
            </div>

            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Headers (JSON)</label>
            <textarea 
              value={restHeaders} 
              onChange={e => setRestHeaders(e.target.value)} 
              className="search-input" 
              style={{ width: '100%', height: '100px', marginBottom: 20, padding: '12px', fontFamily: 'monospace' }} 
            />
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-sm" onClick={() => setShowRestModal(false)} style={{ background: 'transparent', color: 'var(--text-secondary)' }}>Cancel</button>
              <button className="btn btn-sm btn-primary" onClick={handleRestSubmit}>Fetch & Ingest</button>
            </div>
          </div>
        </div>
      )}

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
              <strong>sales_q1.csv</strong> — 12,440 rows ingested · schema inferred · <span style={{color: 'var(--amber)'}}>2 PII columns flagged</span>
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
                <div style={{ width: '60px', color: 'var(--text-muted)', fontSize: '13px' }}>Just now</div>
                <div style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
                  <strong>{ds.name}</strong> — Successfully ingested and added to active pipeline.
                </div>
             </div>
          ))}
        </div>
      </div>

      {hasData && (
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onProceed} style={{ background: 'var(--accent)', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
            Continue to Pipeline →
          </button>
        </div>
      )}

    </div>
  );
}
