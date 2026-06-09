'use client';

import { ColumnType, DataRow } from '@/lib/types';
import { motion } from 'framer-motion';

import { useState } from 'react';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

interface ReportStageProps {
  headers: string[];
  types: Record<string, ColumnType>;
  rows: DataRow[];
  rawRows: DataRow[];
  filename: string;
  appliedOps: any[];
  ingestedAt: string | null;
}

export default function ReportStage({ headers, types, rows, rawRows, filename, appliedOps, ingestedAt }: ReportStageProps) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [cronExp, setCronExp] = useState('0 9 * * 1');
  const [emails, setEmails] = useState('stakeholders@company.com');
  const [scheduleActive, setScheduleActive] = useState(false);

  const exportPDF = () => {
    alert('Mock PDF Export successful! (In a real app, html2pdf would run here).');
  };

  const handleSaveSchedule = () => {
    setScheduleActive(true);
    setShowSchedule(false);
    alert(`Report scheduled! It will run on cron: ${cronExp}`);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="stage-content">
      <motion.div variants={itemVariants} className="stage-header flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="stage-title" style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            <span style={{ marginRight: '12px' }}>📋</span> BI Executive Report
          </h1>
          <p className="stage-sub" style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '16px' }}>Printable summary of the data pipeline and dashboard findings.</p>
        </div>
        <div className="flex gap-8">
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowSchedule(!showSchedule)}
            style={{ borderColor: scheduleActive ? 'var(--emerald)' : 'var(--border)', color: scheduleActive ? 'var(--emerald)' : '#fff' }}
          >
            ⏰ {scheduleActive ? 'Delivery Active' : 'Automate Delivery'}
          </button>
          <button className="btn btn-secondary" onClick={() => window.print()}>🖨 Print Report</button>
          <button 
            className="btn btn-primary" 
            onClick={exportPDF} 
            style={{ 
              background: 'linear-gradient(135deg, var(--emerald), var(--cyan))', 
              border: 'none', 
              color: '#fff', 
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            📄 Export PDF
          </button>
        </div>
      </motion.div>

      {showSchedule && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Schedule Automated Delivery</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>CRON Expression</label>
              <input type="text" className="search-input" value={cronExp} onChange={e => setCronExp(e.target.value)} style={{ width: '100%', padding: '10px', background: 'var(--bg-body)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontFamily: 'monospace' }} />
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>e.g. 0 9 * * 1 (Every Monday at 9 AM)</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Recipient Emails (comma separated)</label>
              <input type="text" className="search-input" value={emails} onChange={e => setEmails(e.target.value)} style={{ width: '100%', padding: '10px', background: 'var(--bg-body)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} />
            </div>
          </div>
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            {scheduleActive && (
              <button className="btn btn-secondary" onClick={() => setScheduleActive(false)} style={{ color: 'var(--rose)', borderColor: 'var(--rose)' }}>Stop Automation</button>
            )}
            <button className="btn btn-primary" onClick={handleSaveSchedule}>Save Schedule</button>
          </div>
        </motion.div>
      )}

      <div style={{ background: '#fff', color: '#000', padding: '40px', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h2 style={{ fontSize: '28px', margin: '0 0 8px 0', color: '#0f172a' }}>Aether BI Report</h2>
            <div style={{ color: '#64748b', fontSize: '14px' }}>Data Operations & Analytics Summary</div>
          </div>
          <div style={{ textAlign: 'right', color: '#64748b', fontSize: '13px' }}>
            <div><strong>Generated:</strong> {new Date().toLocaleDateString()}</div>
            <div><strong>Source:</strong> {filename}</div>
          </div>
        </div>

        <h3 style={{ fontSize: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px', color: '#0f172a' }}>1. Pipeline Details</h3>
        <ul style={{ marginBottom: '32px', color: '#334155', lineHeight: '1.6' }}>
          <li><strong>Ingested At:</strong> {ingestedAt ? new Date(ingestedAt).toLocaleString() : 'N/A'}</li>
          <li><strong>Raw Rows:</strong> {rawRows.length.toLocaleString()}</li>
          <li><strong>Cleaned Rows:</strong> {rows.length.toLocaleString()} ({(rows.length / Math.max(1, rawRows.length) * 100).toFixed(1)}% retention)</li>
          <li><strong>Columns:</strong> {headers.length}</li>
        </ul>

        <h3 style={{ fontSize: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px', color: '#0f172a' }}>2. Transformations Applied</h3>
        {appliedOps.length > 0 ? (
          <ul style={{ marginBottom: '32px', color: '#334155', lineHeight: '1.6' }}>
            {appliedOps.map((op, i) => (
              <li key={i}>
                <strong>{op.type}:</strong> {op.desc}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ color: '#64748b', fontStyle: 'italic', marginBottom: '32px' }}>No transformations applied in the Clean Stage.</div>
        )}

        <h3 style={{ fontSize: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px', color: '#0f172a' }}>3. Data Schema</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '12px', textAlign: 'left', color: '#0f172a' }}>Column Name</th>
              <th style={{ padding: '12px', textAlign: 'left', color: '#0f172a' }}>Data Type</th>
            </tr>
          </thead>
          <tbody>
            {headers.map(h => (
              <tr key={h} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px', color: '#334155' }}>{h}</td>
                <td style={{ padding: '12px', color: '#64748b' }}>
                  <span style={{ background: '#e2e8f0', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{types[h]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', marginTop: '64px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
          Automatically generated by Aether DataOps • CONFIDENTIAL
        </div>
      </div>
    </motion.div>
  );
}
