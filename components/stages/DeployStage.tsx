'use client';

import { ColumnType, DataRow } from '@/lib/types';
import { motion } from 'framer-motion';
import { useState } from 'react';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

interface DeployStageProps {
  headers: string[];
  types: Record<string, ColumnType>;
  rows: DataRow[];
}

export default function DeployStage({ headers, types, rows }: DeployStageProps) {
  const [copied, setCopied] = useState(false);

  const mockEndpoint = "https://api.aether.io/v1/predict/model_78a2f";
  
  const handleCopy = () => {
    navigator.clipboard.writeText(mockEndpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="stage-content">
      <motion.div variants={itemVariants} className="stage-header flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="stage-title" style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            <span style={{ marginRight: '12px' }}>🚀</span> Model Deployment
          </h1>
          <p className="stage-sub" style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '16px' }}>Your model is live. Send payload data to the endpoint to get predictions.</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>REST API Endpoint</h3>
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
          <div style={{ background: 'var(--bg-card-hover)', padding: '12px 16px', borderRadius: '8px', flex: 1, fontFamily: 'monospace', color: 'var(--accent)', border: '1px solid var(--border)' }}>
            {mockEndpoint}
          </div>
          <button className="btn btn-secondary" onClick={handleCopy} style={{ minWidth: '100px' }}>
            {copied ? 'Copied!' : 'Copy URL'}
          </button>
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <motion.div variants={itemVariants} className="card">
          <h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>cURL Example</h3>
          <pre style={{ background: '#0d1117', padding: '16px', borderRadius: '8px', color: '#c9d1d9', fontSize: '13px', overflowX: 'auto', margin: 0 }}>
{`curl -X POST ${mockEndpoint} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "data": [
      {
        "${headers[0] || 'feature_1'}": "value_1",
        "${headers[1] || 'feature_2'}": "value_2"
      }
    ]
  }'`}
          </pre>
        </motion.div>

        <motion.div variants={itemVariants} className="card">
          <h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Python (Requests)</h3>
          <pre style={{ background: '#0d1117', padding: '16px', borderRadius: '8px', color: '#c9d1d9', fontSize: '13px', overflowX: 'auto', margin: 0 }}>
{`import requests

url = "${mockEndpoint}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "data": [{
        "${headers[0] || 'feature_1'}": "value_1",
        "${headers[1] || 'feature_2'}": "value_2"
    }]
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`}
          </pre>
        </motion.div>
      </div>
    </motion.div>
  );
}
