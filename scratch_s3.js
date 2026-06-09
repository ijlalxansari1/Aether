const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'components/stages/IngestStage.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add S3 State
const s3State = `
  const [showS3Modal, setShowS3Modal] = useState(false);
  const [s3AccessKey, setS3AccessKey] = useState('');
  const [s3SecretKey, setS3SecretKey] = useState('');
  const [s3Region, setS3Region] = useState('us-east-1');
  const [s3Bucket, setS3Bucket] = useState('');
  const [s3Key, setS3Key] = useState('');
  const [s3Loading, setS3Loading] = useState(false);
`;
content = content.replace(
  "  const [showBqModal, setShowBqModal] = useState(false);",
  s3State + "\n  const [showBqModal, setShowBqModal] = useState(false);"
);

// 2. Add S3 Handler
const s3Handler = `
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
`;
content = content.replace(
  "  async function handleBqSubmit() {",
  s3Handler + "\n  async function handleBqSubmit() {"
);

// 3. Add onClick to S3 Card
content = content.replace(
  /<div style=\{\{ background: 'var\(--bg-card\)', border: '1px solid var\(--border\)', borderRadius: '12px', padding: '24px', cursor: 'pointer' \}\}\s*onMouseOver=\{e => e\.currentTarget\.style\.borderColor = 'var\(--accent\)'\} onMouseOut=\{e => e\.currentTarget\.style\.borderColor = 'var\(--border\)'\}>\s*<div style=\{\{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' \}\}>\s*<div style=\{\{ width: '40px', height: '40px', background: 'rgba\(245,158,11,0\.1\)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' \}\}>☁️<\/div>\s*<div style=\{\{ background: 'rgba\(245,158,11,0\.15\)', color: 'var\(--amber\)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 \}\}>Object Storage<\/div>\s*<\/div>\s*<h3 style=\{\{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' \}\}>AWS S3<\/h3>/m,
  `<div onClick={() => setShowS3Modal(true)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}
               onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(245,158,11,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>☁️</div>
              <div style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--amber)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Object Storage</div>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' }}>AWS S3</h3>`
);

// 4. Add S3 Modal UI
const s3ModalUI = `
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
`;
content = content.replace("      {/* BigQuery Modal */}", s3ModalUI + "\n      {/* BigQuery Modal */}");

fs.writeFileSync(targetFile, content);
console.log('Added S3 handler and modal.');
