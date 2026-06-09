const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'components/stages/IngestStage.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add Postgres State
const pgState = `
  const [showPgModal, setShowPgModal] = useState(false);
  const [pgHost, setPgHost] = useState('localhost');
  const [pgPort, setPgPort] = useState('5432');
  const [pgUser, setPgUser] = useState('postgres');
  const [pgPassword, setPgPassword] = useState('');
  const [pgDatabase, setPgDatabase] = useState('postgres');
  const [pgQuery, setPgQuery] = useState('SELECT * FROM users LIMIT 100');
  const [pgLoading, setPgLoading] = useState(false);
`;
content = content.replace(
  "  const [showRestModal, setShowRestModal] = useState(false);",
  pgState + "\n  const [showRestModal, setShowRestModal] = useState(false);"
);

// 2. Add Postgres handler
const pgHandler = `
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
      onIngest(headers, data.data, \`pg_\${pgDatabase}.csv\`, 'db');
      setShowPgModal(false);
    } catch (err: any) {
      onError('Postgres Error: ' + err.message);
    } finally {
      setPgLoading(false);
    }
  }
`;
content = content.replace(
  "  async function handleRestSubmit() {",
  pgHandler + "\n  async function handleRestSubmit() {"
);

// 3. Add onClick to Postgres Card
const pgCardRegex = /<h3 style=\{\{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' \}\}>PostgreSQL<\/h3>/;
content = content.replace(
  /<div style=\{\{ background: 'var\(--bg-card\)', border: '1px solid var\(--border\)', borderRadius: '12px', padding: '24px', cursor: 'pointer' \}\}\s*onMouseOver=\{e => e\.currentTarget\.style\.borderColor = 'var\(--accent\)'\} onMouseOut=\{e => e\.currentTarget\.style\.borderColor = 'var\(--border\)'\}>\s*<div style=\{\{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' \}\}>\s*<div style=\{\{ width: '40px', height: '40px', background: 'rgba\(16,185,129,0\.1\)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' \}\}>🐘<\/div>\s*<div style=\{\{ background: 'rgba\(16,185,129,0\.15\)', color: 'var\(--emerald\)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 \}\}>Relational<\/div>\s*<\/div>\s*<h3 style=\{\{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' \}\}>PostgreSQL<\/h3>/m,
  `<div onClick={() => setShowPgModal(true)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}
               onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🐘</div>
              <div style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--emerald)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Relational</div>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' }}>PostgreSQL</h3>`
);


// 4. Add Postgres Modal UI
const pgModalUI = `
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
`;
content = content.replace("      {/* Paste Modal */}", pgModalUI + "\n      {/* Paste Modal */}");

fs.writeFileSync(targetFile, content);
console.log('Added Postgres handler and modal.');
