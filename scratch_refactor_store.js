const fs = require('fs');
const path = require('path');

const storePath = path.join(__dirname, 'components/stages/StoreStage.tsx');
let store = fs.readFileSync(storePath, 'utf8');

// We will add DuckDB logic for merging
store = store.replace(
  /import \{ exportCSV \} from '@\/lib\/dataUtils';/,
  `import { exportCSV } from '@/lib/dataUtils';\nimport { getDb, loadDataToTable, executeQuery } from '@/lib/duckdbUtils';\nimport { useEffect } from 'react';`
);

store = store.replace(
  /interface StoreStageProps \{[\s\S]*?onProceed: \(\) => void;\n\}/,
  `interface StoreStageProps {
  datasets: import('@/lib/types').IngestedDataset[];
  headers: string[];
  schema: DataSchema[];
  rows: DataRow[];
  filename: string;
  ingestedAt: Date | null;
  onProceed: () => void;
  onUpdateRows: (newHeaders: string[], newRows: DataRow[]) => void;
}`
);

store = store.replace(
  /export default function StoreStage\(\{ headers, schema, rows, filename, ingestedAt, onProceed \}: StoreStageProps\) \{/,
  `export default function StoreStage({ datasets, headers, schema, rows, filename, ingestedAt, onProceed, onUpdateRows }: StoreStageProps) {
  const [dbReady, setDbReady] = useState(false);
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM t1;');
  const [isExecuting, setIsExecuting] = useState(false);
  const [sqlError, setSqlError] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const db = await getDb();
        // Load all datasets into DuckDB
        for (let i = 0; i < datasets.length; i++) {
          await loadDataToTable(db, \`t\${i+1}\`, datasets[i].rows);
        }
        setDbReady(true);
        if (datasets.length > 1) {
          setSqlQuery(\`SELECT *\\nFROM t1\\nJOIN t2 ON t1.id = t2.id;\`);
        }
      } catch (err: any) {
        console.error(err);
      }
    }
    if (datasets.length > 0) init();
  }, [datasets]);

  async function handleRunSQL() {
    if (!dbReady) return;
    setIsExecuting(true);
    setSqlError('');
    try {
      const db = await getDb();
      const results = await executeQuery(db, sqlQuery);
      if (results.length > 0) {
        onUpdateRows(Object.keys(results[0]), results);
      }
    } catch (err: any) {
      setSqlError(err.message);
    } finally {
      setIsExecuting(false);
    }
  }
`
);

store = store.replace(
  /return \(\n    <div className="stage-content">/,
  `return (
    <div className="stage-content">
      {datasets.length > 1 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <div className="card-label" style={{ margin: 0 }}>Combine Multiple Datasets</div>
            {!dbReady ? <span style={{color: 'var(--amber)'}}>⏳ Loading tables...</span> : <span style={{color: 'var(--emerald)'}}>✅ Tables Ready: {datasets.map((d,i) => \`t\${i+1}\`).join(', ')}</span>}
          </div>
          <p style={{fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16}}>
            You have loaded {datasets.length} datasets. Use DuckDB SQL to JOIN or UNION them into a single primary table before continuing.
          </p>
          <textarea
            className="paste-area"
            style={{ fontFamily: 'monospace', height: '80px', fontSize: '14px', background: 'var(--bg-surface)', color: 'var(--text-primary)', borderColor: 'var(--border)', width: '100%' }}
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            disabled={!dbReady || isExecuting}
          />
          {sqlError && <div style={{ color: 'var(--rose)', fontSize: 13, marginTop: 8 }}>{sqlError}</div>}
          <div className="flex gap-8" style={{ marginTop: 12 }}>
            <button className="btn btn-secondary" onClick={handleRunSQL} disabled={!dbReady || isExecuting}>
              {isExecuting ? '⏳ Executing...' : '▶ Execute & Update Table'}
            </button>
          </div>
        </div>
      )}
`
);

fs.writeFileSync(storePath, store);
console.log("Updated StoreStage.tsx");

const pagePath = path.join(__dirname, 'app', 'page.tsx');
let page = fs.readFileSync(pagePath, 'utf8');

page = page.replace(
  /<StoreStage\s+headers=\{headers\}\s+schema=\{schema\}\s+rows=\{cleanedRows\}\s+filename=\{filename\}\s+ingestedAt=\{ingestedAt\}\s+onProceed=\{[^}]+\}\s+\/>/,
  `<StoreStage
            datasets={datasets}
            headers={headers}
            schema={schema}
            rows={cleanedRows}
            filename={filename}
            ingestedAt={ingestedAt}
            onProceed={() => setStage('clean')}
            onUpdateRows={handleUpdateRows}
          />`
);

fs.writeFileSync(pagePath, page);
console.log("Updated app/page.tsx");
