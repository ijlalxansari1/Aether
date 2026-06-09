'use client';

import { Stage, UserPath } from '@/lib/types';
import { useEffect, useRef, useMemo } from 'react';

const BASE_STAGES: { id: Stage; label: string; icon: string; desc: string; color: string }[] = [
  { id: 'ingest',    label: 'Ingest',     icon: '⬆',  desc: 'CSV · JSON · Paste · Drag & drop', color: '#00d4ff' },
  { id: 'store',     label: 'Store',      icon: '🗄',  desc: 'Schema detection · Sort · Filter', color: '#7c3aed' },
  { id: 'clean',     label: 'Clean',      icon: '🧹',  desc: 'Nulls · Dupes · Outliers · Regex', color: '#10b981' },
];

const ANALYST_STAGES: { id: Stage; label: string; icon: string; desc: string; color: string }[] = [
  { id: 'analyze',   label: 'Analyze',    icon: '📊',  desc: 'Scatter · Box plot · Correlation', color: '#f59e0b' },
  { id: 'story',     label: 'Story',      icon: '📖',  desc: 'Auto-generated data narrative', color: '#ec4899' },
];

const BI_STAGES: { id: Stage; label: string; icon: string; desc: string; color: string }[] = [
  { id: 'dashboard', label: 'Dashboard',  icon: '📈',  desc: 'KPIs · Bar · Donut · Trend', color: '#6366f1' },
  { id: 'report',    label: 'BI Report',  icon: '📋',  desc: 'PDF · HTML · Share link', color: '#00d4ff' },
];

const DS_STAGES: { id: Stage; label: string; icon: string; desc: string; color: string }[] = [
  { id: 'model',     label: 'Model',      icon: '🧠',  desc: 'AutoML · Train · Test split', color: '#8b5cf6' },
  { id: 'evaluate',  label: 'Evaluate',   icon: '🎯',  desc: 'ROC · Confusion Matrix', color: '#ec4899' },
  { id: 'deploy',    label: 'Deploy',     icon: '🚀',  desc: 'API Endpoint · Batch predict', color: '#10b981' },
];

interface PipelineBarProps {
  current: Stage;
  userPath: UserPath;
  hasData: boolean;
  onStageClick: (s: Stage) => void;
}

export default function PipelineBar({ current, userPath, hasData, onStageClick }: PipelineBarProps) {
  const activeStages = useMemo(() => {
    let stages = [...BASE_STAGES];
    if (userPath === 'analyst') stages = [...stages, ...ANALYST_STAGES];
    else if (userPath === 'bi') stages = [...stages, ...BI_STAGES];
    else if (userPath === 'ds') stages = [...stages, ...DS_STAGES];
    else if (current === 'path-selection') {
      stages.push({ id: 'path-selection', label: 'Path', icon: '🛣️', desc: 'Select your journey', color: '#f59e0b' });
    }
    return stages;
  }, [userPath, current]);

  const curIdx = activeStages.findIndex(s => s.id === current);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to active stage
  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector('.active') as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [current]);

  return (
    <nav className="pipeline-bar-modern" ref={scrollRef}>
      {activeStages.map((s, i) => {
        const isDone = i < curIdx;
        const isActive = i === curIdx;
        const isDisabled = !hasData && i > 0;
        
        let connectorClass = '';
        if (isDone) connectorClass = 'done';
        else if (isActive) connectorClass = 'active';

        return (
          <div key={s.id} className="pipe-card-wrap">
            <div
              className={`pipe-card ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
              onClick={() => {
                if (isDisabled) return;
                if (i <= curIdx || hasData) onStageClick(s.id);
              }}
            >
              <div className="pipe-card-icon" style={{ color: s.color }}>{s.icon}</div>
              <div className="pipe-card-label">{s.label}</div>
              <div className="pipe-card-desc">{s.desc}</div>
            </div>
            
            {i < activeStages.length - 1 && (
              <div className={`pipe-card-connector ${connectorClass}`} style={{ color: isDone ? s.color : isActive ? s.color : 'var(--border-active)' }}>
                →
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
