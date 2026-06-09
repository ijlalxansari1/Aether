const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'app/globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

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
.pipeline-bar-modern::-webkit-scrollbar { height: 6px; }

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
  border-color: var(--amber);
  background: rgba(245, 158, 11, 0.05);
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
.pipe-card.active .pipe-card-icon { background: rgba(245, 158, 11, 0.15); }
.pipe-card-label { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; }
.pipe-card-desc { font-size: 11px; color: var(--text-secondary); line-height: 1.4; }
.pipe-card-connector { color: var(--border-active); font-size: 16px; font-weight: bold; }
.pipe-card-connector.done { color: var(--emerald); }
.pipe-card-connector.active { color: var(--amber); }
`;

if (!css.includes('.pipeline-bar-modern')) {
  fs.writeFileSync(cssPath, css + '\n' + pipelineCSS);
}
