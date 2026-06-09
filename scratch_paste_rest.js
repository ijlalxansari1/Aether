const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'components/stages/IngestStage.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add state variables for modals
const stateVars = `
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  
  const [showRestModal, setShowRestModal] = useState(false);
  const [restUrl, setRestUrl] = useState('');
  const [restMethod, setRestMethod] = useState('GET');
  const [restHeaders, setRestHeaders] = useState('{\\n  "Authorization": "Bearer YOUR_TOKEN"\\n}');
`;
content = content.replace(
  "export default function IngestStage({ onIngest, logs, hasData, datasets, onProceed, onError }: IngestStageProps) {",
  `export default function IngestStage({ onIngest, logs, hasData, datasets, onProceed, onError }: IngestStageProps) {\n${stateVars}`
);

// 2. Add handlers
const handlers = `
  function handlePasteSubmit() {
    if (!pasteText.trim()) return;
    try {
      const lines = pasteText.trim().split('\\n');
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
`;
content = content.replace(
  "  function handleFile(f: File) {",
  handlers + "\n  function handleFile(f: File) {"
);

// 3. Add onClick to Paste CSV
content = content.replace(
  "        {/* Card 3 */}\n        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}>",
  "        {/* Card 3 */}\n        <div onClick={() => setShowPasteModal(true)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}>"
);

// 4. Add onClick to REST API
content = content.replace(
  "        {/* Card 2 */}\n        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}>",
  "        {/* Card 2 */}\n        <div onClick={() => setShowRestModal(true)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}>"
);

// 5. Add Modals UI
const modalsUI = `
      {/* Paste Modal */}
      {showPasteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ minWidth: '600px', background: 'var(--bg-surface)' }}>
            <h2 style={{ marginBottom: 16 }}>Paste CSV Data</h2>
            <textarea 
              placeholder="id,name,age\\n1,Alice,24\\n2,Bob,30" 
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
`;

content = content.replace("      {/* Ingestion Log */}", modalsUI + "\n      {/* Ingestion Log */}");

fs.writeFileSync(targetFile, content);
console.log('Added Paste CSV and REST API handlers.');
