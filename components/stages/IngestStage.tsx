'use client';

import { useRef, useState } from 'react';
import { DataRow } from '@/lib/types';
import { SAMPLE_DATASETS } from '@/lib/samples';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Enterprise Features State
  const [isStreaming, setIsStreaming] = useState(false);
  const [enableContract, setEnableContract] = useState(false);
  const [contractCols, setContractCols] = useState('5');
  


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

  function getRecommendations(dataset: any) {
    if (!dataset) return [];
    const recs = [
      "Store Raw: Proceed to the Store stage to safely land this raw data into your Data Warehouse before transformation."
    ];
    
    if (dataset.rows.length > 1000) {
      recs.push("Volume Check: Dataset has over 1,000 rows. In the Integrate/Transform phase, consider filtering or aggregating early to reduce compute costs.");
    }

    let hasNulls = false;
    const sample = dataset.rows.slice(0, 50);
    for (const row of sample) {
      if (Object.values(row).some(v => v === null || v === '' || v === undefined)) {
        hasNulls = true;
        break;
      }
    }
    
    if (hasNulls) {
      recs.push("Data Quality: Missing values detected. Use the Integrate/Transform stage to impute or drop nulls before further integration.");
    }
    
    const hasDates = dataset.headers.some((h: string) => h.toLowerCase().includes('date') || h.toLowerCase().includes('time'));
    if (hasDates) {
      recs.push("Time-Series: Date/time columns detected. Ensure standardization (e.g. ISO 8601) during the Transform phase to enable temporal joins.");
    }

    return recs;
  }

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


  async function handleFile(file: File) {
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.zip')) {
      try {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(file);
        
        // Find the first .csv file in the zip
        const csvFile = Object.values(loadedZip.files).find(f => !f.dir && f.name.toLowerCase().endsWith('.csv'));
        if (!csvFile) {
          return onError('No CSV file found in the ZIP archive.');
        }

        const csvContent = await csvFile.async('text');
        const safeName = csvFile.name.split('/').pop()?.replace(/[^a-zA-Z0-9.\-_]/g, '') || 'extracted_data.csv';
        
        const Papa = (await import('papaparse')).default;
        Papa.parse(csvContent, {
          header: true, skipEmptyLines: true, dynamicTyping: true,
          complete: (r: any) => {
            if (!r.data || !r.data.length) return onError('CSV file in ZIP is empty');
            onIngest(r.meta.fields || [], r.data, safeName, 'csv');
          }
        });
      } catch (err: any) {
        onError('Failed to extract ZIP: ' + err.message);
      }
      return;
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    import('papaparse').then(({ default: Papa }) => {
      Papa.parse(file as any, {
        header: true, skipEmptyLines: true, dynamicTyping: true,
        complete: (r: any) => {
          if (!r.data || !r.data.length) return onError('CSV file is empty');
          
          const hdrs = r.meta.fields || [];
          
          // Data Contract Validation (Schema Drift)
          if (enableContract) {
            const expectedCols = parseInt(contractCols, 10);
            if (!isNaN(expectedCols) && hdrs.length !== expectedCols) {
              return onError(`SCHEMA DRIFT DETECTED: Contract expected ${expectedCols} columns, but received ${hdrs.length} columns.`);
            }
          }

          onIngest(hdrs, r.data, safeName, 'csv', isStreaming);
        }
      });
    });
  }

  async function mockPDFParse() {
    const mockHeaders = ['DocumentId', 'ExtractedText', 'ConfidenceScore', 'PageNumber'];
    const mockRows = [{ DocumentId: 'DOC_001', ExtractedText: 'Q3 Earnings Report summary...', ConfidenceScore: 0.98, PageNumber: 1 }];
    onIngest(mockHeaders, mockRows, 'extracted_documents.pdf', 'pdf');
  }

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
      style={{ maxWidth: '1200px', margin: '0 auto', color: 'var(--text-primary)', fontFamily: 'system-ui, sans-serif' }}
    >
      
      {/* Top Header */}
      <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99,102,241,0.15)', color: 'var(--accent)', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, marginBottom: '20px', border: '1px solid rgba(99,102,241,0.3)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)' }} />
          Step 1 of 5 · Extract
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Integration Hub</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '16px' }}>
          Connect a source to begin ingestion. All data is encrypted and consent-stamped on arrival.
        </p>
      </motion.div>


      {/* Enterprise Toggles */}
      <motion.div variants={itemVariants} style={{ display: 'flex', gap: '24px', marginBottom: '32px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input type="checkbox" id="streamToggle" checked={isStreaming} onChange={e => setIsStreaming(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--emerald)' }} />
          <div>
            <label htmlFor="streamToggle" style={{ display: 'block', fontWeight: 600, color: isStreaming ? 'var(--emerald)' : 'var(--text-primary)', cursor: 'pointer' }}>Enable Streaming Mode</label>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Simulate real-time ingestion (25 rows/sec) and jump to live Dashboard.</span>
          </div>
        </div>

        <div style={{ width: '1px', background: 'var(--border)' }}></div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input type="checkbox" id="contractToggle" checked={enableContract} onChange={e => setEnableContract(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--amber)' }} />
          <div>
            <label htmlFor="contractToggle" style={{ display: 'block', fontWeight: 600, color: enableContract ? 'var(--amber)' : 'var(--text-primary)', cursor: 'pointer' }}>Enforce Data Contract</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Require exactly:</span>
              <input type="number" value={contractCols} onChange={e => setContractCols(e.target.value)} disabled={!enableContract} style={{ width: '60px', background: 'transparent', border: '1px solid var(--border)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>columns to prevent schema drift.</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants} style={{ display: 'flex', gap: '32px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '32px', position: 'relative' }}>
        {['enterprise', 'local', 'samples'].map(tab => (
          <div 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{ 
              padding: '0 0 16px 0', 
              color: activeTab === tab ? 'var(--cyan)' : 'var(--text-secondary)', 
              fontSize: '15px', 
              fontWeight: activeTab === tab ? 600 : 400, 
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            {tab === 'enterprise' ? 'Cloud & databases' : tab === 'local' ? 'Local & APIs' : 'Sample datasets'}
            {activeTab === tab && (
              <motion.div 
                layoutId="activeTab"
                style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: 'var(--cyan)', boxShadow: '0 0 10px var(--cyan)' }}
              />
            )}
          </div>
        ))}
      </motion.div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}
          >
            {activeTab === 'enterprise' && (
              <>
                <motion.div whileHover={{ y: -4, borderColor: 'var(--sky)', boxShadow: '0 10px 30px rgba(56,189,248,0.1)' }} onClick={() => setShowSfModal(true)} className="card" style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ width: '48px', height: '48px', background: 'rgba(56,189,248,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>❄️</div>
                    <div style={{ background: 'rgba(56,189,248,0.15)', color: 'var(--sky)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, height: 'fit-content' }}>Data Warehouse</div>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0' }}>Snowflake</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, lineHeight: 1.6 }}>Native integration. Pull live data or run push-down queries directly in Snowflake compute.</p>
                </motion.div>
                <motion.div whileHover={{ y: -4, borderColor: 'var(--rose)', boxShadow: '0 10px 30px rgba(239,68,68,0.1)' }} onClick={() => setShowBqModal(true)} className="card" style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ width: '48px', height: '48px', background: 'rgba(239,68,68,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🔍</div>
                    <div style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--rose)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, height: 'fit-content' }}>Google Cloud</div>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0' }}>BigQuery</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, lineHeight: 1.6 }}>High-performance streaming. Synchronize massive datasets instantaneously without exiting Aether.</p>
                </motion.div>
                <motion.div whileHover={{ y: -4, borderColor: 'var(--amber)', boxShadow: '0 10px 30px rgba(245,158,11,0.1)' }} onClick={() => setShowS3Modal(true)} className="card" style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ width: '48px', height: '48px', background: 'rgba(245,158,11,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>☁️</div>
                    <div style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--amber)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, height: 'fit-content' }}>Object Storage</div>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0' }}>AWS S3</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, lineHeight: 1.6 }}>Batch process millions of files. Parquet, Avro, and JSON optimized readers built-in.</p>
                </motion.div>
                <motion.div whileHover={{ y: -4, borderColor: 'var(--emerald)', boxShadow: '0 10px 30px rgba(16,185,129,0.1)' }} onClick={() => setShowPgModal(true)} className="card" style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ width: '48px', height: '48px', background: 'rgba(16,185,129,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🐘</div>
                    <div style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--emerald)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, height: 'fit-content' }}>Relational</div>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0' }}>PostgreSQL</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, lineHeight: 1.6 }}>Direct connection to production databases. Read-replica support standard.</p>
                </motion.div>
              </>
            )}

            {activeTab === 'samples' && (
              <>
                {Object.values(SAMPLE_DATASETS).map(fn => fn()).map((s, idx) => (
                  <motion.div 
                    key={idx}
                    whileHover={{ y: -4, borderColor: 'var(--cyan)', background: 'var(--bg-card-hover)', boxShadow: '0 10px 30px rgba(6,182,212,0.1)' }}
                    onClick={() => onIngest(s.headers, s.rows, s.name, 'csv')}
                    className="card"
                    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' }}
                  >
                    <div style={{ width: '40px', height: '40px', background: 'rgba(6,182,212,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: 'var(--cyan)', marginBottom: '8px' }}>📄</div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{s.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>{s.rows.length} rows · Pre-cleaned dataset for testing</p>
                  </motion.div>
                ))}
              </>
            )}

            {activeTab === 'local' && (
              <>
                <motion.div whileHover={{ y: -4, borderColor: 'var(--accent)', boxShadow: '0 10px 30px rgba(99,102,241,0.1)' }} onClick={() => fileRef.current?.click()} className="card" style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ width: '48px', height: '48px', background: 'rgba(99,102,241,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📁</div>
                    <div style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, height: 'fit-content' }}>Recommended</div>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0' }}>Upload file</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 16px 0', lineHeight: 1.6 }}>CSV, Parquet, JSON, Excel. Auto-detects schema and flags PII columns.</p>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: 'var(--emerald)' }}>✓</span> Encrypted on upload</div>
                  <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(f => handleFile(f)); }} />
                </motion.div>
                <motion.div whileHover={{ y: -4, borderColor: 'var(--cyan)', boxShadow: '0 10px 30px rgba(6,182,212,0.1)' }} onClick={() => setShowRestModal(true)} className="card" style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ width: '48px', height: '48px', background: 'rgba(6,182,212,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🌐</div>
                    <div style={{ background: 'rgba(6,182,212,0.15)', color: 'var(--cyan)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, height: 'fit-content' }}>REST / GraphQL</div>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0' }}>REST API</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 16px 0', lineHeight: 1.6 }}>Connect any HTTP endpoint. Bearer token, OAuth 2.0, or API key auth.</p>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: 'var(--cyan)' }}>↻</span> Supports polling schedules</div>
                </motion.div>
                <motion.div whileHover={{ y: -4, borderColor: 'var(--emerald)', boxShadow: '0 10px 30px rgba(16,185,129,0.1)' }} onClick={() => setShowPasteModal(true)} className="card" style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ width: '48px', height: '48px', background: 'rgba(16,185,129,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📋</div>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0' }}>Paste CSV</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 16px 0', lineHeight: 1.6 }}>Quick ingest for small datasets. Paste raw text, AETHER parses structure instantly.</p>
                </motion.div>
                <motion.div whileHover={{ y: -4, borderColor: 'var(--amber)', boxShadow: '0 10px 30px rgba(245,158,11,0.1)' }} onClick={mockPDFParse} className="card" style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ width: '48px', height: '48px', background: 'rgba(245,158,11,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📄</div>
                    <div style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--amber)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, height: 'fit-content' }}>OCR</div>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0' }}>Parse PDF</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 16px 0', lineHeight: 1.6 }}>Extract structured data from PDFs via OCR. Tables, forms, and text blocks detected.</p>
                </motion.div>
              </>
            )}
          </motion.div>
        </AnimatePresence>




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

      {/* Data Preview */}
      <motion.div variants={itemVariants} style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--sky)' }}></div>
          <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '1px', color: 'var(--text-secondary)' }}>DATA PREVIEW</span>
        </div>
        <div className="card" style={{ overflowX: 'auto', padding: 0, minHeight: '100px', display: 'flex', flexDirection: 'column' }}>
          {datasets.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Waiting for data... Connect a source above to see the preview.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {datasets[datasets.length - 1].headers.slice(0, 8).map((h: string) => (
                    <th key={h} style={{ padding: '12px 16px', color: 'var(--cyan)', fontWeight: 600 }}>{h}</th>
                  ))}
                  {datasets[datasets.length - 1].headers.length > 8 && <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>...</th>}
                </tr>
              </thead>
              <tbody>
                {datasets[datasets.length - 1].rows.slice(0, 5).map((row: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    {datasets[datasets.length - 1].headers.slice(0, 8).map((h: string) => (
                      <td key={h} style={{ padding: '12px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                        {String(row[h] ?? '-')}
                      </td>
                    ))}
                    {datasets[datasets.length - 1].headers.length > 8 && <td style={{ padding: '12px 16px' }}>...</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      {/* Smart Recommendations */}
      <motion.div variants={itemVariants} style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }}></div>
          <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '1px', color: 'var(--text-secondary)' }}>ELT SMART RECOMMENDATIONS</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
          {datasets.length === 0 ? (
             <div className="card" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', background: 'var(--bg-surface)' }}>
               System will analyze data size, quality, and schema upon ingestion to recommend next ELT steps.
             </div>
          ) : (
            getRecommendations(datasets[datasets.length - 1]).map((rec, idx) => {
              const parts = rec.split(': ');
              const title = parts[0];
              const desc = parts.slice(1).join(': ');
              return (
                <div key={idx} className="card" style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'var(--bg-surface)' }}>
                  <div style={{ width: '24px', height: '24px', background: 'rgba(99,102,241,0.1)', color: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 'bold' }}>!</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: 1.5 }}>
                    <strong style={{ color: 'var(--accent)' }}>{title}: </strong> {desc}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </motion.div>

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

    </motion.div>
  );
}
