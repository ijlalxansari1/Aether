const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'app', 'globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Fix pipeline bar clipping
css = css.replace(/\.pipe-step-wrap\s*\{[^}]+\}/, `.pipe-step-wrap { 
  display: flex; 
  align-items: flex-start; 
  flex: 1; 
  min-width: 70px; 
}`);

css = css.replace(/\.pipe-connector\s*\{[^}]+\}/, `.pipe-connector {
  height: 2px; 
  flex: 1; 
  background: var(--border);
  margin: 0 -2px; 
  margin-top: 22px; /* Aligns with the center of the 32px circle which has 6px top padding */
  transition: var(--transition); 
  min-width: 16px;
}`);

// 2. Add top margin to `.pipeline-bar` so it doesn't look squished
css = css.replace(/\.pipeline-bar\s*\{[\s\S]*?border-bottom:[^\}]*\}/, `.pipeline-bar {
  display: flex;
  align-items: flex-start;
  padding: 16px 20px 8px;
  overflow-x: auto;
  gap: 0;
  -webkit-overflow-scrolling: touch;
  position: sticky;
  top: 60px;
  z-index: 90;
  background: var(--bg-base);
  border-bottom: 1px solid var(--border);
}`);

// Write back
fs.writeFileSync(cssPath, css);
console.log("Pipeline CSS updated!");
