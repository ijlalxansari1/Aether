const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'app/globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Better Dark Theme
const oldDark = `--bg-base:        #000000;
  --bg-surface:     #0A0A0A;
  --bg-card:        #121212;
  --bg-card-hover:  #1A1A1A;
  --border:         rgba(255, 255, 255, 0.1);
  --border-active:  rgba(255, 255, 255, 0.2);`;

const newDark = `--bg-base:        #050505;
  --bg-surface:     rgba(10, 10, 12, 0.5);
  --bg-card:        rgba(20, 20, 25, 0.4);
  --bg-card-hover:  rgba(35, 35, 45, 0.6);
  --border:         rgba(255, 255, 255, 0.08);
  --border-active:  rgba(255, 255, 255, 0.15);`;

css = css.replace(oldDark, newDark);

// 2. Better Slate Theme
const oldSlate = `--bg-base:        #0F111A;
  --bg-surface:     #161822;
  --bg-card:        #1B1E2B;
  --bg-card-hover:  #222636;
  --border:         #2A2F42;
  --border-active:  #383F57;`;

const newSlate = `--bg-base:        #0B0D14;
  --bg-surface:     rgba(15, 17, 26, 0.6);
  --bg-card:        rgba(27, 30, 43, 0.5);
  --bg-card-hover:  rgba(40, 45, 65, 0.7);
  --border:         rgba(255, 255, 255, 0.08);
  --border-active:  rgba(255, 255, 255, 0.15);`;

css = css.replace(oldSlate, newSlate);

// 3. Add global body gradient & glassmorphism
const glassCSS = `
/* Premium Glassmorphism & Gradients */
body {
  background: radial-gradient(ellipse at 50% -20%, rgba(99, 102, 241, 0.15), var(--bg-base) 70%), var(--bg-base);
  background-attachment: fixed;
}
.app-root { background: transparent; }
.topbar, .pipeline-bar-modern, .global-sidebar {
  background: var(--bg-surface) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
.pipe-card, [style*="var(--bg-card)"] {
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 24px rgba(0,0,0,0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.pipe-card:hover, [style*="var(--bg-card)"]:hover {
  transform: translateY(-2px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 12px 32px rgba(0,0,0,0.4);
}
`;

if (!css.includes('Premium Glassmorphism')) {
  css += '\n' + glassCSS;
}

fs.writeFileSync(cssPath, css);
console.log('Premium themes injected.');
