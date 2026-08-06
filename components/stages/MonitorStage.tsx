'use client';

import { ColumnType, DataRow } from '@/lib/types';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

interface MonitorStageProps {
  headers: string[];
  types: Record<string, ColumnType>;
  rows: DataRow[];
  onProceed: () => void;
}

export default function MonitorStage({ headers, types, rows, onProceed }: MonitorStageProps) {
  const [now, setNow] = useState(new Date());
  const [simulatedData, setSimulatedData] = useState<{ time: string, rows: number }[]>([]);
  
  useEffect(() => {
    // Simulate historical runs
    const data = [];
    const baseRows = rows.length || 1000;
    for (let i = 10; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600000 * 24); // daily runs
      const drift = Math.floor(Math.random() * (baseRows * 0.1)) - (baseRows * 0.05); // +/- 5% variance
      // Introduce an anomaly 2 days ago
      const isAnomaly = i === 2;
      data.push({
        time: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        rows: isAnomaly ? Math.floor(baseRows * 0.6) : Math.floor(baseRows + drift)
      });
    }
    setSimulatedData(data);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const lastRun = new Date(now.getTime() - 1000 * 60 * 45); // 45 mins ago
  const nextRun = new Date(now.getTime() + 1000 * 60 * 15); // 15 mins from now
  const isHealthy = true;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="stage-content">
      <motion.div variants={itemVariants} className="stage-header flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="stage-title" style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            <span style={{ marginRight: '12px' }}>📡</span> Data Observability
          </h1>
          <p className="stage-sub" style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '16px' }}>Monitor pipeline health, data freshness, and historical anomalies.</p>
        </div>
        <button className="btn btn-primary" onClick={onProceed} style={{ background: 'linear-gradient(135deg, var(--violet), var(--accent))', border: 'none', fontWeight: 'bold' }}>
          CI/CD Deploy →
        </button>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <motion.div variants={itemVariants} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>System Status</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: isHealthy ? 'var(--emerald)' : 'var(--rose)', boxShadow: `0 0 10px ${isHealthy ? 'var(--emerald)' : 'var(--rose)'}` }} />
            <span style={{ fontSize: '24px', fontWeight: 700, color: isHealthy ? 'var(--emerald)' : 'var(--rose)' }}>
              {isHealthy ? 'Healthy' : 'Downtime Detected'}
            </span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Last Run (Freshness)</h3>
          <span style={{ fontSize: '24px', fontWeight: 700 }}>45m ago</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{lastRun.toLocaleTimeString()}</span>
        </motion.div>

        <motion.div variants={itemVariants} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Next Scheduled Run</h3>
          <span style={{ fontSize: '24px', fontWeight: 700 }}>In 15m</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{nextRun.toLocaleTimeString()}</span>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <motion.div variants={itemVariants} className="card">
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Volume Anomalies (Past 10 Runs)</h3>
          <div style={{ height: '250px', minWidth: 0 }}>
            <ResponsiveContainer width="99%" height="100%" minWidth={0}>
              <LineChart data={simulatedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="rows" stroke="var(--cyan)" strokeWidth={3} dot={{ fill: 'var(--cyan)', r: 4 }} activeDot={{ r: 6, fill: 'var(--accent)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(244, 63, 94, 0.1)', borderLeft: '4px solid var(--rose)', borderRadius: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--rose)', fontWeight: 600, fontSize: '14px' }}>
              <span>⚠️</span>
              Volume Drop Detected
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              A significant drop in ingested rows (-40%) was detected 2 runs ago. Upstream source may have failed partially.
            </p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Schema Drift Alerts</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'var(--bg-card-hover)', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--amber)' }}>New Column</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>45m ago</span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Column <code>customer_ltv</code> was added to the source dataset.</p>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-card-hover)', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--rose)' }}>Type Mismatch</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>1d ago</span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Column <code>{headers[0] || 'id'}</code> changed from <code>INT</code> to <code>STRING</code>. Pipeline auto-cast successfully.</p>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-card-hover)', border: '1px solid var(--border)', borderRadius: '8px', opacity: 0.7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--emerald)' }}>Resolved</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>2d ago</span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Missing column <code>email</code> has been restored.</p>
            </div>
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
}
