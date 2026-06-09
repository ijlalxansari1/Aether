const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'components/stages/IngestStage.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add Snowflake & BigQuery State
const newStates = `
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

  const [showBqModal, setShowBqModal] = useState(false);
  const [bqProjectId, setBqProjectId] = useState('');
  const [bqClientEmail, setBqClientEmail] = useState('');
  const [bqPrivateKey, setBqPrivateKey] = useState('');
  const [bqQuery, setBqQuery] = useState('SELECT * FROM \`my-project.my_dataset.my_table\` LIMIT 100');
  const [bqLoading, setBqLoading] = useState(false);
`;
content = content.replace(
  "  const [showPgModal, setShowPgModal] = useState(false);",
  newStates + "\n  const [showPgModal, setShowPgModal] = useState(false);"
);

// 2. Add Handlers
const newHandlers = `
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
      onIngest(headers, data.data, \`snowflake_\${sfDatabase}.csv\`, 'db');
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
      onIngest(headers, data.data, \`bigquery_\${bqProjectId}.csv\`, 'db');
      setShowBqModal(false);
    } catch (err: any) {
      onError('BigQuery Error: ' + err.message);
    } finally {
      setBqLoading(false);
    }
  }
`;
content = content.replace(
  "  async function handlePgSubmit() {",
  newHandlers + "\n  async function handlePgSubmit() {"
);

// 3. Add onClick to Snowflake and BigQuery Cards
content = content.replace(
  /<div style=\{\{ background: 'var\(--bg-card\)', border: '1px solid var\(--border\)', borderRadius: '12px', padding: '24px', cursor: 'pointer' \}\}\s*onMouseOver=\{e => e\.currentTarget\.style\.borderColor = 'var\(--accent\)'\} onMouseOut=\{e => e\.currentTarget\.style\.borderColor = 'var\(--border\)'\}>\s*<div style=\{\{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' \}\}>\s*<div style=\{\{ width: '40px', height: '40px', background: 'rgba\(56,189,248,0\.1\)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' \}\}>❄️<\/div>\s*<div style=\{\{ background: 'rgba\(56,189,248,0\.15\)', color: 'var\(--sky\)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 \}\}>Data Warehouse<\/div>\s*<\/div>\s*<h3 style=\{\{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' \}\}>Snowflake<\/h3>/m,
  `<div onClick={() => setShowSfModal(true)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}
               onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(56,189,248,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>❄️</div>
              <div style={{ background: 'rgba(56,189,248,0.15)', color: 'var(--sky)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Data Warehouse</div>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' }}>Snowflake</h3>`
);

content = content.replace(
  /<div style=\{\{ background: 'var\(--bg-card\)', border: '1px solid var\(--border\)', borderRadius: '12px', padding: '24px', cursor: 'pointer' \}\}\s*onMouseOver=\{e => e\.currentTarget\.style\.borderColor = 'var\(--accent\)'\} onMouseOut=\{e => e\.currentTarget\.style\.borderColor = 'var\(--border\)'\}>\s*<div style=\{\{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' \}\}>\s*<div style=\{\{ width: '40px', height: '40px', background: 'rgba\(239,68,68,0\.1\)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' \}\}>🔍<\/div>\s*<div style=\{\{ background: 'rgba\(239,68,68,0\.15\)', color: 'var\(--rose\)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 \}\}>Google Cloud<\/div>\s*<\/div>\s*<h3 style=\{\{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' \}\}>BigQuery<\/h3>/m,
  `<div onClick={() => setShowBqModal(true)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}
               onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🔍</div>
              <div style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--rose)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Google Cloud</div>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' }}>BigQuery</h3>`
);

// 4. Add Modals UI
const newModalsUI = `
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
              <textarea value={bqPrivateKey} onChange={e => setBqPrivateKey(e.target.value)} placeholder="-----BEGIN PRIVATE KEY-----\\n..." className="search-input" style={{ width: '100%', height: '80px', padding: '8px', fontFamily: 'monospace' }} />
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
`;
content = content.replace("      {/* Postgres Modal */}", newModalsUI + "\n      {/* Postgres Modal */}");

fs.writeFileSync(targetFile, content);
console.log('Added Snowflake and BigQuery handlers and modals.');
