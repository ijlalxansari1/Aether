'use client';

import { Stage } from '@/lib/types';

const STAGES: { id: Stage; label: string; icon: string; tip: string }[] = [
  { id: 'ingest',    label: 'Ingest',     icon: '⬆',  tip: 'ETL / ELT' },
  { id: 'store',     label: 'Store',      icon: '🗄',  tip: 'Warehouse'  },
  { id: 'clean',     label: 'Clean',      icon: '🧹',  tip: 'Preprocess' },
  { id: 'analyze',   label: 'Analyze',    icon: '📊',  tip: 'BI / Stats' },
  { id: 'story',     label: 'Story',      icon: '📖',  tip: 'Narrative'  },
  { id: 'dashboard', label: 'Dashboard',  icon: '📈',  tip: 'Reporting'  },
  { id: 'report',    label: 'BI Report',  icon: '📋',  tip: 'Export'     },
];

interface PipelineBarProps {
  current: Stage;
  hasData: boolean;
  onStageClick: (s: Stage) => void;
}

export default function PipelineBar({ current, hasData, onStageClick }: PipelineBarProps) {
  const curIdx = STAGES.findIndex(s => s.id === current);

  return (
    <nav className="pipeline-bar">
      {STAGES.map((s, i) => {
        const isDone = i < curIdx;
        const isActive = i === curIdx;
        const cls = isDone ? 'done' : isActive ? 'active' : '';

        return (
          <div key={s.id} className="pipe-step-wrap">
            <div
              className={`pipe-step ${cls}`}
              onClick={() => {
                if (!hasData && i > 0) return;
                if (i <= curIdx) onStageClick(s.id);
              }}
              title={s.tip}
            >
              <div className="step-circle">{s.icon}</div>
              <div className="step-label">{s.label}</div>
              <div className="step-status">
                {isDone ? 'Complete' : isActive ? 'Active' : s.tip}
              </div>
            </div>
            {i < STAGES.length - 1 && (
              <div className={`pipe-connector ${isDone ? 'done' : isActive ? 'active' : ''}`} />
            )}
          </div>
        );
      })}
    </nav>
  );
}
