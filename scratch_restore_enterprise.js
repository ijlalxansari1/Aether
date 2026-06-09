const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'components/stages/IngestStage.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const regex = /\{\s*activeTab\s*===\s*'enterprise'\s*&&\s*\([\s\S]*?\)\s*\}/;

const replacement = `{activeTab === 'enterprise' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '40px' }}>
          
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}
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

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}
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

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}
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

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}
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
      )}`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(targetFile, content);
  console.log('Restored enterprise connectors.');
} else {
  console.log('Regex did not match!');
}
