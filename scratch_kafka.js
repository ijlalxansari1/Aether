const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'components/stages/IngestStage.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add Kafka State
const kafkaState = `
  const [showKafkaModal, setShowKafkaModal] = useState(false);
  const [kafkaBrokers, setKafkaBrokers] = useState('localhost:9092');
  const [kafkaTopic, setKafkaTopic] = useState('events');
  const [kafkaGroupId, setKafkaGroupId] = useState('aether-group');
  const [kafkaLoading, setKafkaLoading] = useState(false);
`;
content = content.replace(
  "  const [showS3Modal, setShowS3Modal] = useState(false);",
  kafkaState + "\n  const [showS3Modal, setShowS3Modal] = useState(false);"
);

// 2. Add Kafka Handler
const kafkaHandler = `
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
      onIngest(headers, data.data, \`kafka_\${kafkaTopic}.csv\`, 'db');
      setShowKafkaModal(false);
    } catch (err: any) {
      onError('Kafka Error: ' + err.message);
    } finally {
      setKafkaLoading(false);
    }
  }
`;
content = content.replace(
  "  async function handleS3Submit() {",
  kafkaHandler + "\n  async function handleS3Submit() {"
);

// 3. Add onClick to Kafka Card
content = content.replace(
  /<div style=\{\{ background: 'var\(--bg-card\)', border: '1px solid var\(--border\)', borderRadius: '12px', padding: '24px', cursor: 'pointer' \}\}>\s*<div style=\{\{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' \}\}>\s*<div style=\{\{ width: '40px', height: '40px', background: 'rgba\(245,158,11,0\.1\)', borderRadius: '8px' \}\}><\/div>\s*<div style=\{\{ background: 'rgba\(245,158,11,0\.15\)', color: 'var\(--amber\)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 \}\}>Streaming<\/div>\s*<\/div>\s*<h3 style=\{\{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' \}\}>Kafka stream<\/h3>/m,
  `<div onClick={() => setShowKafkaModal(true)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}
               onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(245,158,11,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>⚡</div>
              <div style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--amber)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Streaming</div>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' }}>Kafka stream</h3>`
);

// 4. Add Kafka Modal UI
const kafkaModalUI = `
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
`;
content = content.replace("      {/* AWS S3 Modal */}", kafkaModalUI + "\n      {/* AWS S3 Modal */}");

fs.writeFileSync(targetFile, content);
console.log('Added Kafka handler and modal.');
