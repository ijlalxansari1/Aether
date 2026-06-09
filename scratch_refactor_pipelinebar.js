const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'app/globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. ADD CSS FOR NEW PIPELINE BAR
const pipelineCSS = `
/* ── Modern Pipeline Bar ─────────────────────────────────────────────── */
.pipeline-bar-modern {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding: 24px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  scrollbar-width: thin;
}
.pipeline-bar-modern::-webkit-scrollbar {
  height: 6px;
}

.pipe-card-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pipe-card {
  width: 140px;
  height: 140px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  position: relative;
}

.pipe-card:hover:not(.disabled) {
  background: var(--bg-card-hover);
  border-color: var(--border-active);
}

.pipe-card.active {
  border-color: var(--amber); /* or accent */
  background: rgba(245, 158, 11, 0.05); /* very faint amber */
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.pipe-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pipe-card-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.05);
  font-size: 16px;
  margin-bottom: 12px;
}

.pipe-card.active .pipe-card-icon {
  background: rgba(245, 158, 11, 0.15); /* amber tint */
}

.pipe-card-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.pipe-card-desc {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.pipe-card-connector {
  color: var(--border-active);
  font-size: 16px;
  font-weight: bold;
}
.pipe-card-connector.done {
  color: var(--emerald);
}
.pipe-card-connector.active {
  color: var(--amber);
}
`;

if (!css.includes('.pipeline-bar-modern')) {
  fs.writeFileSync(cssPath, css + '\n' + pipelineCSS);
}

// 2. REWRITE PIPELINEBAR.TSX
const targetFile = path.join(__dirname, 'components/PipelineBar.tsx');

const newContent = `
'use client';

import { Stage } from '@/lib/types';
import { useEffect, useRef } from 'react';

const STAGES: { id: Stage; label: string; icon: string; desc: string; color: string }[] = [
  { id: 'ingest',    label: 'Ingest',     icon: '⬆',  desc: 'CSV · JSON · Paste · Drag & drop', color: '#00d4ff' },
  { id: 'store',     label: 'Store',      icon: '🗄',  desc: 'Schema detection · Sort · Filter', color: '#7c3aed' },
  { id: 'clean',     label: 'Clean',      icon: '🧹',  desc: 'Nulls · Dupes · Outliers · Regex', color: '#10b981' },
  { id: 'ethics',    label: 'Ethics',     icon: '⚖️',  desc: 'Bias checks · PII detection · Audit', color: '#ef4444' },
  { id: 'analyze',   label: 'Analyze',    icon: '📊',  desc: 'Scatter · Box plot · Correlation', color: '#f59e0b' },
  { id: 'story',     label: 'Story',      icon: '📖',  desc: 'Auto-generated data narrative', color: '#ec4899' },
  { id: 'dashboard', label: 'Dashboard',  icon: '📈',  desc: 'KPIs · Bar · Donut · Trend', color: '#6366f1' },
  { id: 'report',    label: 'BI Report',  icon: '📋',  desc: 'PDF · HTML · Share link', color: '#00d4ff' },
];

interface PipelineBarProps {
  current: Stage;
  hasData: boolean;
  onStageClick: (s: Stage) => void;
}

export default function PipelineBar({ current, hasData, onStageClick }: PipelineBarProps) {
  const curIdx = STAGES.findIndex(s => s.id === current);
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
      {STAGES.map((s, i) => {
        const isDone = i < curIdx;
        const isActive = i === curIdx;
        const isDisabled = !hasData && i > 0;
        
        let connectorClass = '';
        if (isDone) connectorClass = 'done';
        else if (isActive) connectorClass = 'active';

        return (
          <div key={s.id} className="pipe-card-wrap">
            <div
              className={\`pipe-card \${isActive ? 'active' : ''} \${isDisabled ? 'disabled' : ''}\`}
              onClick={() => {
                if (isDisabled) return;
                if (i <= curIdx || hasData) onStageClick(s.id);
              }}
            >
              <div className="pipe-card-icon" style={{ color: s.color }}>{s.icon}</div>
              <div className="pipe-card-label">{s.label}</div>
              <div className="pipe-card-desc">{s.desc}</div>
            </div>
            
            {i < STAGES.length - 1 && (
              <div className={\`pipe-card-connector \${connectorClass}\`} style={{ color: isDone ? s.color : isActive ? s.color : 'var(--border-active)' }}>
                →
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
`;

fs.writeFileSync(targetFile, newContent);
console.log('PipelineBar refactored to modern card style.');
`;

fs.writeFileSync(path.join(__dirname, 'scratch_refactor_pipelinebar.js'), pipelineCSS);
