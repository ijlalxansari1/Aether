const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'components/stages/IngestStage.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// The replacement logic: we will replace from `{/* Tabs */}` up to `      </div>` that closes the cards grid before `{/* Ingestion Log */}`

const replaceString = `
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
        <div 
          onClick={() => setActiveTab('enterprise')}
          style={{ padding: '0 0 12px 0', color: activeTab === 'enterprise' ? 'var(--accent)' : 'var(--text-secondary)', borderBottom: activeTab === 'enterprise' ? '2px solid var(--accent)' : 'none', fontSize: '14px', fontWeight: activeTab === 'enterprise' ? 500 : 400, cursor: 'pointer' }}
        >
          Enterprise connectors
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
        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '40px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>🏢</div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Enterprise Connectors</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
            Snowflake, BigQuery, AWS S3, and Postgres connections are available in the Aether Enterprise tier.
          </p>
        </div>
      )}

      {activeTab === 'samples' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          {SAMPLE_DATASETS.map((s, idx) => (
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
      )}
`.trim();

const pattern = /\{\/\*\s*Tabs\s*\*\/\}.*?\{\/\*\s*Card 6\s*\*\/\}.*?<\/div>\s*<\/div>/s;

if (pattern.test(content)) {
  content = content.replace(pattern, replaceString);
  fs.writeFileSync(targetFile, content);
  console.log('Successfully wired up tabs.');
} else {
  console.error('Regex pattern did not match. Exiting.');
}
