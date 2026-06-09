const fs = require('fs');
const path = require('path');

const storePath = path.join(__dirname, 'components/stages/StoreStage.tsx');
let store = fs.readFileSync(storePath, 'utf8');

// 1. Add state variables for visual builder
store = store.replace(
  /const \[sqlError, setSqlError\] = useState\(''\);/,
  `const [sqlError, setSqlError] = useState('');
  const [mergeMode, setMergeMode] = useState<'visual' | 'sql'>('visual');
  const [joinType, setJoinType] = useState('JOIN');
  const [tableA, setTableA] = useState('t1');
  const [tableB, setTableB] = useState('t2');
  const [colA, setColA] = useState('');
  const [colB, setColB] = useState('');`
);

// 2. Pre-populate colA and colB when tables change
store = store.replace(
  /if \(datasets\.length > 0\) init\(\);\n  \}, \[datasets\]\);/,
  `if (datasets.length > 0) init();
  }, [datasets]);

  // Try to find common columns for auto-join
  useEffect(() => {
    if (datasets.length < 2) return;
    const dsA = datasets[parseInt(tableA.replace('t','')) - 1];
    const dsB = datasets[parseInt(tableB.replace('t','')) - 1];
    if (dsA && dsB) {
      if (!colA) setColA(dsA.headers[0]);
      if (!colB) setColB(dsB.headers[0]);
    }
  }, [tableA, tableB, datasets, colA, colB]);`
);

// 3. Modify handleRunSQL to generate SQL if in visual mode
store = store.replace(
  /async function handleRunSQL\(\) \{/,
  `async function handleRunSQL() {
    let finalQuery = sqlQuery;
    if (mergeMode === 'visual') {
      if (joinType === 'UNION ALL') {
        finalQuery = \`SELECT * FROM \${tableA} UNION ALL SELECT * FROM \${tableB};\`;
      } else {
        finalQuery = \`SELECT * FROM \${tableA} \${joinType} \${tableB} ON \${tableA}.\${colA} = \${tableB}.\${colB};\`;
      }
      setSqlQuery(finalQuery); // Sync it to the text area
    }`
);

// 4. Update the UI to show the Visual Builder
const visualBuilderUI = `
      {datasets.length > 1 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <div className="card-label" style={{ margin: 0 }}>Combine Multiple Datasets</div>
            {!dbReady ? <span style={{color: 'var(--amber)'}}>⏳ Loading tables...</span> : <span style={{color: 'var(--emerald)'}}>✅ Tables Ready: {datasets.map((d,i) => \`t\${i+1}\`).join(', ')}</span>}
          </div>
          
          <div className="chart-tabs" style={{ marginBottom: 16 }}>
            <button className={\`chart-tab \${mergeMode === 'visual' ? 'active' : ''}\`} onClick={() => setMergeMode('visual')}>🧩 Visual Builder</button>
            <button className={\`chart-tab \${mergeMode === 'sql' ? 'active' : ''}\`} onClick={() => setMergeMode('sql')}>💻 Advanced SQL</button>
          </div>

          {mergeMode === 'visual' ? (
            <div className="stat-row" style={{ alignItems: 'flex-end', marginBottom: 16 }}>
              <div className="axis-picker" style={{ flex: 1 }}>
                <label className="adv-label">Left Table</label>
                <select className="adv-select" value={tableA} onChange={e => setTableA(e.target.value)}>
                  {datasets.map((d, i) => <option key={i} value={\`t\${i+1}\`}>t{i+1} ({d.name})</option>)}
                </select>
              </div>
              
              <div className="axis-picker" style={{ flex: 1 }}>
                <label className="adv-label">Join Type</label>
                <select className="adv-select" value={joinType} onChange={e => setJoinType(e.target.value)}>
                  <option value="JOIN">Inner Join</option>
                  <option value="LEFT JOIN">Left Join</option>
                  <option value="FULL OUTER JOIN">Full Join</option>
                  <option value="UNION ALL">Union All</option>
                </select>
              </div>

              <div className="axis-picker" style={{ flex: 1 }}>
                <label className="adv-label">Right Table</label>
                <select className="adv-select" value={tableB} onChange={e => setTableB(e.target.value)}>
                  {datasets.map((d, i) => <option key={i} value={\`t\${i+1}\`}>t{i+1} ({d.name})</option>)}
                </select>
              </div>
            </div>
          ) : (
            <>
              <p style={{fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8}}>
                Write raw DuckDB SQL to combine the tables. (Available tables: {datasets.map((d,i) => \`t\${i+1}\`).join(', ')})
              </p>
              <textarea
                className="paste-area"
                style={{ fontFamily: 'monospace', height: '80px', fontSize: '14px', background: 'var(--bg-surface)', color: 'var(--text-primary)', borderColor: 'var(--border)', width: '100%' }}
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                disabled={!dbReady || isExecuting}
              />
            </>
          )}

          {mergeMode === 'visual' && joinType !== 'UNION ALL' && (
             <div className="stat-row" style={{ alignItems: 'center', marginBottom: 16 }}>
                <div className="axis-picker" style={{ flex: 1 }}>
                  <label className="adv-label">Match Column from {tableA}</label>
                  <select className="adv-select" value={colA} onChange={e => setColA(e.target.value)}>
                    {datasets[parseInt(tableA.replace('t','')) - 1]?.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 20, padding: '0 10px' }}>=</div>
                <div className="axis-picker" style={{ flex: 1 }}>
                  <label className="adv-label">Match Column from {tableB}</label>
                  <select className="adv-select" value={colB} onChange={e => setColB(e.target.value)}>
                    {datasets[parseInt(tableB.replace('t','')) - 1]?.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
             </div>
          )}

          {sqlError && <div style={{ color: 'var(--rose)', fontSize: 13, marginTop: 8 }}>{sqlError}</div>}
          <div className="flex gap-8" style={{ marginTop: 12 }}>
            <button className="btn btn-secondary" onClick={handleRunSQL} disabled={!dbReady || isExecuting}>
              {isExecuting ? '⏳ Executing...' : '▶ Execute Combine'}
            </button>
          </div>
        </div>
      )}
`;

store = store.replace(
  /\{datasets\.length > 1 && \([\s\S]*?\}\)\n/m,
  visualBuilderUI + '\n'
);

fs.writeFileSync(storePath, store);
console.log("Updated StoreStage.tsx with visual builder");
