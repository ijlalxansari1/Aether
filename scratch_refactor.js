const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'app', 'page.tsx');
let page = fs.readFileSync(pagePath, 'utf8');

// 1. Add `datasets` to state
page = page.replace(
  /const \[stage, setStage\] = useState<Stage>\('ingest'\);/,
  `const [stage, setStage] = useState<Stage>('ingest');\n  const [datasets, setDatasets] = useState<any[]>([]);`
);

// 2. Modify `handleIngest` to append to `datasets` instead of overwriting rawRows immediately.
// We also need it to keep the current behavior of setting rawRows if it's the first dataset, so the pipeline doesn't break.
const newHandleIngest = `
  const handleIngest = useCallback((hdrs: string[], rows: DataRow[], fname: string, type: 'csv'|'api'|'pdf'|'db' = 'csv') => {
    const ds = { id: Math.random().toString(36).substr(2, 9), name: fname, headers: hdrs, rows, sourceType: type, ingestedAt: new Date() };
    
    setDatasets(prev => {
      const next = [...prev, ds];
      
      // If it's the first dataset, we also set it as the primary rawRows for now to maintain backward compatibility with downstream stages
      // until they are updated to use DuckDB JOINs.
      if (next.length === 1) {
        const t = inferTypes(hdrs, rows);
        const sch = hdrs.map(h => {
          const p = profileColumn(h, t[h], rows);
          return { name: h, type: t[h], nullCount: p.nulls, uniqueCount: p.unique ?? rows.length };
        });
        setHeaders(hdrs);
        setRawRows(rows);
        setCleanedRows(JSON.parse(JSON.stringify(rows)));
        setTypes(t);
        setSchema(sch);
        setFilename(fname);
        setIngestedAt(new Date());
      }
      return next;
    });

    setLogs(prev => [
      ...prev,
      \`» Loaded [\${type.toUpperCase()}] \${fname} (\${rows.length} rows, \${hdrs.length} cols)\`
    ]);
    setShowHero(false);
    showToast(\`✓ Loaded \${fname}\`, 'success');
  }, []);
`;
page = page.replace(/const handleIngest = useCallback\([\s\S]*?\}, \[\]\);/, newHandleIngest);

// Update IngestStage call in page.tsx
page = page.replace(
  /<IngestStage[\s\S]*?\/>/,
  `<IngestStage
            onIngest={handleIngest}
            logs={logs}
            hasData={datasets.length > 0}
            datasets={datasets}
            onProceed={() => setStage('store')}
            onError={msg => showToast(msg, 'error')}
          />`
);

fs.writeFileSync(pagePath, page);
console.log("Updated app/page.tsx");

const ingestPath = path.join(__dirname, 'components/stages/IngestStage.tsx');
let ingest = fs.readFileSync(ingestPath, 'utf8');

// Update Props
ingest = ingest.replace(
  /interface IngestStageProps \{[\s\S]*?\}/,
  `interface IngestStageProps {
  onIngest: (headers: string[], rows: DataRow[], filename: string, type: 'csv'|'api'|'pdf'|'db') => void;
  logs: string[];
  hasData: boolean;
  datasets: any[];
  onProceed: () => void;
  onError: (msg: string) => void;
}`
);

// Update Signature
ingest = ingest.replace(
  /export default function IngestStage\([^)]+\) \{/,
  `export default function IngestStage({ onIngest, logs, hasData, datasets, onProceed, onError }: IngestStageProps) {`
);

// Fix invocations of onIngest
ingest = ingest.replace(/onIngest\(([^,]+), ([^,]+), safeName\);/g, "onIngest($1, $2, safeName, 'csv');");
ingest = ingest.replace(/onIngest\(([^,]+), ([^,]+), 'pasted_data.csv'\);/g, "onIngest($1, $2, 'pasted_data.csv', 'csv');");
ingest = ingest.replace(/onIngest\(([^,]+), ([^,]+), new URL\(apiUrl\).hostname \|\| 'api_data'\);/g, "onIngest($1, $2, new URL(apiUrl).hostname || 'api_data', 'api');");
ingest = ingest.replace(/onIngest\(ds.headers, ds.rows, \`\$\{name\}_sample.csv\`\);/g, "onIngest(ds.headers, ds.rows, \`\$\{name\}_sample.csv\`, 'csv');");


// Add PDF mock function and button
const pdfMock = `
  async function mockPDFParse() {
    setIsFetching(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsFetching(false);
    const mockHeaders = ['DocumentId', 'ExtractedText', 'ConfidenceScore', 'PageNumber'];
    const mockRows = [
      { DocumentId: 'DOC_001', ExtractedText: 'Q3 Earnings Report summary...', ConfidenceScore: 0.98, PageNumber: 1 },
      { DocumentId: 'DOC_001', ExtractedText: 'Revenue increased by 15% YoY...', ConfidenceScore: 0.95, PageNumber: 2 },
      { DocumentId: 'DOC_002', ExtractedText: 'Invoice #49281 total is $4,200', ConfidenceScore: 0.89, PageNumber: 1 },
    ];
    onIngest(mockHeaders, mockRows, 'extracted_documents.pdf', 'pdf');
  }
`;

ingest = ingest.replace(/async function fetchFromApi\(\) \{/, pdfMock + '\n  async function fetchFromApi() {');

// Add PDF button to local tab
ingest = ingest.replace(
  /<button className="btn btn-secondary" style=\{\{ padding: '24px', fontSize: '15px' \}\} onClick=\{\(\) => setShowModal\('paste'\)\}>📝 Paste CSV<\/button>/,
  `<button className="btn btn-secondary" style={{ padding: '24px', fontSize: '15px' }} onClick={() => setShowModal('paste')}>📝 Paste CSV</button>
              <button className="btn btn-secondary" style={{ padding: '24px', fontSize: '15px' }} onClick={mockPDFParse}>📄 Parse PDF (OCR)</button>`
);

// Update bottom summary to show number of datasets
ingest = ingest.replace(
  /<span className="ingest-summary">\{rowCount\} rows × \{colCount\} cols<\/span>/,
  `<span className="ingest-summary">{datasets.length} Dataset(s) Loaded</span>`
);

fs.writeFileSync(ingestPath, ingest);
console.log("Updated IngestStage.tsx");
