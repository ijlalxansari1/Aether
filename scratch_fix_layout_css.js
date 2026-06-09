const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'app/globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

const layoutCSS = `
/* ── Main App Layout ─────────────────────────────────────────────── */
.app-root {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-base);
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-surface);
  flex-shrink: 0;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

.pipeline-bar-modern {
  flex-shrink: 0; /* Prevent squishing */
}

/* Fix the ugly scrollbar on pipeline bar */
.pipeline-bar-modern::-webkit-scrollbar {
  height: 8px;
}
.pipeline-bar-modern::-webkit-scrollbar-track {
  background: transparent;
}
.pipeline-bar-modern::-webkit-scrollbar-thumb {
  background: var(--border-active);
  border-radius: 4px;
}
`;

if (!css.includes('.app-root {')) {
  fs.writeFileSync(cssPath, css + '\n' + layoutCSS);
  console.log('Added missing layout structure CSS.');
} else {
  // If .app-root exists but is missing flex-direction, replace it.
  css = css.replace('.pipeline-bar-modern {', '.pipeline-bar-modern {\n  flex-shrink: 0;');
  fs.writeFileSync(cssPath, css);
}
