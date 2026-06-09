const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'components/stages/IngestStage.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

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
  "  function handleFile(file: File) {",
  handlers + "\n  function handleFile(file: File) {"
);

fs.writeFileSync(targetFile, content);
console.log('Fixed handlers');
