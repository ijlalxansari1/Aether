'use client';

import { Stage, UserPath, DataUnderstanding } from '@/lib/types';
import { useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

interface PipelineBarProps {
  current: Stage;
  userPath: UserPath;
  hasData: boolean;
  understanding?: DataUnderstanding | null;
  onStageClick: (s: Stage) => void;
}

export default function PipelineBar({ current, userPath, hasData, understanding, onStageClick }: PipelineBarProps) {
  const activeStages = useMemo(() => {
    const stages: { id: Stage; label: string; icon: string; desc: string; color: string }[] = [
      { id: 'ingest',    label: 'Ingest',     icon: '⬆',  desc: 'Extract datasets', color: '#00d4ff' },
      { id: 'discovery', label: 'Discovery',  icon: '🔍', desc: 'Aether Decisions', color: '#10b981' },
      { id: 'clean',     label: 'Clean',      icon: '🧹',  desc: 'Resolve issues', color: '#7c3aed' },
      { id: 'analyze',   label: 'Analyze',    icon: '📊',  desc: 'Explore stats', color: '#f59e0b' },
    ];

    if (!understanding) {
      const extraStages: { id: Stage; label: string; icon: string; desc: string; color: string }[] = [
        { id: 'dashboard', label: 'Dashboard',  icon: '📈',  desc: 'Visualize data', color: '#6366f1' },
        { id: 'model',     label: 'Model',      icon: '🧠',  desc: 'Train ML models', color: '#ec4899' },
        { id: 'deploy',    label: 'Deploy',     icon: '🚀',  desc: 'Publish pipeline', color: '#10b981' }
      ];
      return [
        ...stages,
        ...extraStages
      ];
    }

    // Dynamic addition of dashboard stage if recommended
    const recs = understanding.recommendations || [];
    const hasDashboard = recs.some(r => r.category === 'dashboard');
    const hasML = recs.some(r => r.category === 'prediction' && r.id !== 'no_prediction');

    if (hasDashboard) {
      stages.push({ id: 'dashboard', label: 'Dashboard',  icon: '📈',  desc: 'Visualize data', color: '#6366f1' });
    }

    if (hasML) {
      stages.push({ id: 'model',     label: 'Model',      icon: '🧠',  desc: 'Train ML models', color: '#ec4899' });
    }

    stages.push({ id: 'deploy',    label: 'Deploy',     icon: '🚀',  desc: 'Publish pipeline', color: '#10b981' });

    return stages;
  }, [understanding]);

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
            <motion.div
              whileHover={isDisabled ? {} : { scale: 1.05, y: -2 }}
              whileTap={isDisabled ? {} : { scale: 0.98 }}
              animate={isActive ? { scale: 1.05, borderColor: s.color, boxShadow: `0 0 15px ${s.color}33` } : { scale: 1, borderColor: 'var(--border)' }}
              transition={{ duration: 0.2 }}
              className={`pipe-card ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
              onClick={() => {
                if (isDisabled) return;
                if (i <= curIdx || hasData) onStageClick(s.id);
              }}
              style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
            >
              <div className="pipe-card-icon" style={{ color: s.color }}>{s.icon}</div>
              <div className="pipe-card-label">{s.label}</div>
              <div className="pipe-card-desc">{s.desc}</div>
            </motion.div>
            
            {i < activeStages.length - 1 && (
              <motion.div 
                initial={false}
                animate={{ color: isDone ? s.color : isActive ? s.color : 'var(--border-active)' }}
                className={`pipe-card-connector ${connectorClass}`}
              >
                →
              </motion.div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

