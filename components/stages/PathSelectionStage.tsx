'use client';

import { UserPath } from '@/lib/types';

interface PathSelectionStageProps {
  onSelectPath: (path: UserPath) => void;
}

export default function PathSelectionStage({ onSelectPath }: PathSelectionStageProps) {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', color: 'var(--text-primary)', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Top Header */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(99,102,241,0.15)', color: 'var(--accent)', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, marginBottom: '16px' }}>
          Data Engineering Complete
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 700, margin: '0 0 12px 0' }}>Choose Your Path</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '16px', maxWidth: '600px', marginInline: 'auto' }}>
          Your data is ingested, stored, and cleaned. Where do you want to go next?
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        
        {/* Analyst */}
        <div 
          onClick={() => onSelectPath('analyst')}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--cyan)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <div style={{ width: '64px', height: '64px', background: 'rgba(6,182,212,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '24px' }}>
            📊
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 12px 0' }}>Data Analyst</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 24px 0', lineHeight: 1.5 }}>
            Dive deep into the data. Create scatter plots, box plots, find correlations, and generate data narratives.
          </p>
          <div style={{ marginTop: 'auto', background: 'rgba(6,182,212,0.15)', color: 'var(--cyan)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>
            Analyze → Story
          </div>
        </div>

        {/* BI Engineer */}
        <div 
          onClick={() => onSelectPath('bi')}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--emerald)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <div style={{ width: '64px', height: '64px', background: 'rgba(16,185,129,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '24px' }}>
            📈
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 12px 0' }}>BI Engineer</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 24px 0', lineHeight: 1.5 }}>
            Build executive dashboards. Create KPIs, bar charts, donut charts, and export beautiful BI Reports.
          </p>
          <div style={{ marginTop: 'auto', background: 'rgba(16,185,129,0.15)', color: 'var(--emerald)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>
            Dashboard → BI Report
          </div>
        </div>

        {/* Data Scientist */}
        <div 
          onClick={() => onSelectPath('ds')}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--violet)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <div style={{ width: '64px', height: '64px', background: 'rgba(139,92,246,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '24px' }}>
            🧠
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 12px 0' }}>Data Scientist</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 24px 0', lineHeight: 1.5 }}>
            Train machine learning models. Evaluate model metrics, tune hyperparameters, and deploy to production.
          </p>
          <div style={{ marginTop: 'auto', background: 'rgba(139,92,246,0.15)', color: 'var(--violet)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>
            Model → Evaluate → Deploy
          </div>
        </div>

      </div>

    </div>
  );
}
