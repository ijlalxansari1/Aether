const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'app', 'globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Tokens: Solid, ultra-clean
const newTokens = `:root {
  /* Hyper-clean Linear-inspired Solid Theme */
  --bg-base:        #0E0E0E;
  --bg-surface:     #141414;
  --bg-card:        #1A1A1A;
  --bg-card-hover:  #222222;
  --border:         rgba(255, 255, 255, 0.08);
  --border-active:  rgba(255, 255, 255, 0.16);

  --accent:         #5E6AD2;
  --accent-hover:   #6C79E8;

  --cyan:           #5E6AD2; /* Reusing accent to unify the UI */
  --cyan-dim:       rgba(94, 106, 210, 0.15);
  --violet:         #7928ca;
  --violet-dim:     rgba(121, 40, 202, 0.15);
  --emerald:        #10b981;
  --amber:          #f59e0b;
  --rose:           #ef4444;
  --sky:            #38bdf8;

  --text-primary:   #F2F2F2;
  --text-secondary: #8E8E8E;
  --text-muted:     #666666;

  --radius-sm:  6px;
  --radius-md:  8px;
  --radius-lg:  12px;
  --radius-xl:  16px;
  --transition: all 0.2s ease;
  
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.4);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.5);
  --shadow-lg: 0 12px 32px rgba(0,0,0,0.6);
  --shadow-glow: none;
}`;

css = css.replace(/:root\s*\{[\s\S]*?--shadow-glow:[^\}]*\}/, newTokens);

// 2. Clean Background (No gradients)
css = css.replace(/body\s*\{[\s\S]*?line-height:[^\}]*\}/, `body {
  font-family: 'Inter', system-ui, sans-serif;
  background: var(--bg-base);
  color: var(--text-primary);
  min-height: 100vh;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 14px;
  line-height: 1.5;
  background-image: none;
}`);

// 3. Card: Solid, sharp, precise borders
css = css.replace(/\.card\s*\{[\s\S]*?transition:[^\}]*\}/, `.card {
  background: var(--bg-card);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
}`);
css = css.replace(/\.card:hover\s*\{[^}]+\}/, `.card:hover {
  border-color: var(--border-active);
  transform: translateY(-1px);
  background: var(--bg-card-hover);
}`);

// 4. Buttons: Professional and solid
css = css.replace(/\.btn-primary\s*\{[\s\S]*?text-shadow:[^\}]*\}/, `.btn-primary {
  background: var(--text-primary);
  color: var(--bg-base);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
}`);
css = css.replace(/\.btn-primary:hover\s*\{[^}]+\}/, `.btn-primary:hover {
  transform: none;
  background: #ffffff;
  box-shadow: var(--shadow-md);
  color: var(--bg-base);
}`);

css = css.replace(/\.btn-secondary\s*\{[\s\S]*?color:[^\}]*\}/, `.btn-secondary {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  backdrop-filter: none;
  color: var(--text-primary);
  border-radius: var(--radius-md);
}`);
css = css.replace(/\.btn-secondary:hover\s*\{[^}]+\}/, `.btn-secondary:hover {
  border-color: var(--border-active);
  background: var(--bg-card);
  color: var(--text-primary);
}`);

// 5. Topbar: Solid and opaque, removing blur
css = css.replace(/\.topbar\s*\{[\s\S]*?box-shadow:[^\}]*\}/, `.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 60px;
  background: var(--bg-surface);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: none;
}`);

// Logo tweak (remove gradient)
css = css.replace(/\.logo-text\s*\{[\s\S]*?-webkit-text-fill-color:[^\}]*\}/, `.logo-text {
  font-size: 18px; font-weight: 700; letter-spacing: -0.5px;
  color: var(--text-primary);
  background: none;
  -webkit-text-fill-color: initial;
}`);
css = css.replace(/\.logo-icon\s*\{[\s\S]*?font-size:[^\}]*\}/, `.logo-icon {
  width: 24px; height: 24px;
  background: var(--accent);
  border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px;
  color: #fff;
}`);

// 6. Pipeline Bar: Solid background, correct sticky
css = css.replace(/\.pipeline-bar\s*\{[\s\S]*?border-bottom:[^\}]*\}/, `.pipeline-bar {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  overflow-x: auto;
  gap: 0;
  -webkit-overflow-scrolling: touch;
  position: sticky;
  top: 60px;
  z-index: 90;
  background: var(--bg-base);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border-bottom: 1px solid var(--border);
}`);

css = css.replace(/\.pipe-step\.active \.step-circle\s*\{[^}]+\}/, `.pipe-step.active .step-circle {
  border-color: var(--accent);
  background: var(--accent);
  box-shadow: none;
  transform: none;
  color: #fff;
}`);
css = css.replace(/\.pipe-step\.active \.step-label\s*\{[^}]+\}/, `.pipe-step.active .step-label { color: var(--text-primary); }`);
css = css.replace(/\.pipe-step\.active \.step-status\s*\{[^}]+\}/, `.pipe-step.active .step-status { background: var(--border); color: var(--text-primary); }`);
css = css.replace(/\.pipe-connector\.active\s*\{[^}]+\}/, `.pipe-connector.active { background: var(--border); }`);
css = css.replace(/\.pipe-connector\.done\s*\{[^}]+\}/, `.pipe-connector.done { background: var(--accent); }`);

// 7. Fix tables
css = css.replace(/thead th\s*\{[\s\S]*?white-space:[^\}]*\}/, `thead th {
  background: var(--bg-card);
  padding: 10px 14px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}`);

// Remove drop-zone big glows
css = css.replace(/\.drop-zone:hover,\s*\.drop-zone\.drag-over\s*\{[^}]+\}/, `.drop-zone:hover, .drop-zone.drag-over {
  border-color: var(--accent);
  background: rgba(94, 106, 210, 0.05);
  box-shadow: none;
}`);

// 8. Sidebar tweaks
css = css.replace(/\.global-sidebar\s*\{[\s\S]*?flex-shrink:[^\}]*\}/, `.global-sidebar {
  width: 240px;
  background: var(--bg-surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 16px 0;
  z-index: 50;
  flex-shrink: 0;
}`);

// 9. Main layout padding tweaks
css = css.replace(/\.main-content\s*\{[\s\S]*?width:[^\}]*\}/, `.main-content {
  flex: 1;
  margin-top: 0;
  padding: 32px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
}`);


fs.writeFileSync(cssPath, css);
console.log("Linear style update complete!");
