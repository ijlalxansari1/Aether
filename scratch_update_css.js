const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'app', 'globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Update Tokens for a more friendly, softer glassmorphic dark theme
const newTokens = `:root {
  /* Premium Glassmorphic Dark Theme */
  --bg-base:        #0d0f17;
  --bg-surface:     #141722;
  --bg-card:        rgba(26, 30, 43, 0.5);
  --bg-card-hover:  rgba(35, 40, 56, 0.7);
  --border:         rgba(255, 255, 255, 0.06);
  --border-active:  rgba(255, 255, 255, 0.15);

  --cyan:           #00e5ff;
  --cyan-dim:       rgba(0, 229, 255, 0.15);
  --violet:         #b388ff;
  --violet-dim:     rgba(179, 136, 255, 0.15);
  --emerald:        #00e676;
  --amber:          #ffab00;
  --rose:           #ff1744;
  --sky:            #40c4ff;

  --text-primary:   #ffffff;
  --text-secondary: #b0bec5;
  --text-muted:     #78909c;

  --radius-sm:  10px;
  --radius-md:  16px;
  --radius-lg:  24px;
  --radius-xl:  32px;
  --transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  
  --shadow-sm: 0 4px 12px rgba(0,0,0,0.1);
  --shadow-md: 0 8px 24px rgba(0,0,0,0.2);
  --shadow-lg: 0 16px 48px rgba(0,0,0,0.3);
  --shadow-glow: 0 0 20px rgba(0, 229, 255, 0.2);
}`;

css = css.replace(/:root\s*\{[\s\S]*?--transition:[^\}]*\}/, newTokens);

// 2. Enhance Global Body and Background
css = css.replace(/body\s*\{[^}]+\}/, `body {
  font-family: 'Inter', system-ui, sans-serif;
  background: var(--bg-base);
  color: var(--text-primary);
  min-height: 100vh;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-image:
    radial-gradient(circle at 0% 0%, rgba(179, 136, 255, 0.08), transparent 40%),
    radial-gradient(circle at 100% 100%, rgba(0, 229, 255, 0.08), transparent 40%),
    radial-gradient(circle at 50% 50%, rgba(0, 230, 118, 0.03), transparent 60%);
  background-attachment: fixed;
  font-size: 15px; /* slightly larger base for readability */
  line-height: 1.6;
}`);

// 3. Improve Cards with true glassmorphism
css = css.replace(/\.card\s*\{[\s\S]*?transition:[^\}]*\}/, `.card {
  background: var(--bg-card);
  backdrop-filter: blur(32px) saturate(200%);
  -webkit-backdrop-filter: blur(32px) saturate(200%);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 28px;
  box-shadow: var(--shadow-md);
  transition: var(--transition);
}`);
css = css.replace(/\.card:hover\s*\{[^}]+\}/, `.card:hover {
  box-shadow: var(--shadow-lg), inset 0 0 0 1px rgba(255,255,255,0.1);
  transform: translateY(-4px);
  background: var(--bg-card-hover);
}`);

// 4. Enhance Buttons
css = css.replace(/\.btn-primary\s*\{[\s\S]*?border:[^\}]*\}/, `.btn-primary {
  background: linear-gradient(135deg, var(--cyan), var(--violet));
  color: #000;
  font-weight: 800;
  box-shadow: 0 4px 14px rgba(0, 229, 255, 0.4);
  border: none;
  text-shadow: none;
}`);
css = css.replace(/\.btn-primary:hover\s*\{[^}]+\}/, `.btn-primary:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 24px rgba(179, 136, 255, 0.5);
  color: #000;
}`);

css = css.replace(/\.btn-secondary\s*\{[\s\S]*?color:[^\}]*\}/, `.btn-secondary {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  backdrop-filter: blur(10px);
  color: var(--text-primary);
}`);
css = css.replace(/\.btn-secondary:hover\s*\{[^}]+\}/, `.btn-secondary:hover {
  border-color: var(--cyan);
  background: var(--cyan-dim);
  color: var(--cyan);
}`);

// 5. Enhance Topbar
css = css.replace(/\.topbar\s*\{[\s\S]*?box-shadow:[^\}]*\}/, `.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  height: 72px;
  background: rgba(13, 15, 23, 0.6);
  backdrop-filter: blur(40px) saturate(200%);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 4px 30px rgba(0,0,0,0.3);
}`);

// 6. Enhance Pipeline Bar
css = css.replace(/\.pipeline-bar\s*\{[\s\S]*?border-bottom:[^\}]*\}/, `.pipeline-bar {
  display: flex;
  align-items: center;
  padding: 24px 20px;
  overflow-x: auto;
  gap: 0;
  -webkit-overflow-scrolling: touch;
  position: sticky;
  top: 72px;
  z-index: 90;
  background: rgba(13, 15, 23, 0.7);
  backdrop-filter: blur(32px) saturate(180%);
  -webkit-backdrop-filter: blur(32px) saturate(180%);
  border-bottom: 1px solid var(--border);
}`);
css = css.replace(/\.pipe-step\.active \.step-circle\s*\{[^}]+\}/, `.pipe-step.active .step-circle {
  border-color: var(--cyan);
  background: var(--cyan-dim);
  box-shadow: var(--shadow-glow);
  transform: scale(1.1);
}`);

// 7. Make tables more readable
css = css.replace(/tbody tr:hover\s*\{[^}]+\}/, `tbody tr:hover {
  background: rgba(255, 255, 255, 0.05);
}`);
css = css.replace(/thead th\s*\{[\s\S]*?white-space:[^\}]*\}/, `thead th {
  background: var(--bg-surface);
  padding: 12px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}`);

// Write back
fs.writeFileSync(cssPath, css);
console.log("globals.css updated!");
