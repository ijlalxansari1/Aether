const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'app', 'globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

// I will just replace the whole section of .pipe-step.active and .pipe-step.done properly

const correctCSS = `
.pipe-step:hover { background: var(--bg-card-hover); }
.pipe-step.active .step-circle {
  border-color: var(--accent);
  background: var(--accent);
  box-shadow: none;
  transform: none;
  color: #fff;
}
.pipe-step.active .step-label { color: var(--text-primary); }
.pipe-step.active .step-status { background: var(--border); color: var(--text-primary); }
.pipe-step.done .step-circle   { border-color: var(--text-primary); background: rgba(16,185,129,0.12); color: var(--text-primary); }
.pipe-step.done .step-label    { color: var(--text-primary); }
.pipe-step.done .step-status   { background: rgba(16,185,129,0.12); color: var(--text-primary); }
`;

// Remove the broken global ones:
css = css.replace(/\.step-circle\s*\{\s*border-color: var\(--accent\);[\s\S]*?\}/g, '');
css = css.replace(/\.step-label\s*\{\s*color: var\(--text-primary\);\s*\}/g, '');
css = css.replace(/\.step-status\s*\{\s*background: var\(--border\);\s*color: var\(--text-primary\);\s*\}/g, '');
css = css.replace(/\.step-circle\s*\{\s*border-color: var\(--text-primary\);\s*background: rgba\(16,185,129,0\.12\);\s*\}/g, '');
css = css.replace(/\.step-label\s*\{\s*color: var\(--text-primary\);\s*\}/g, '');
css = css.replace(/\.step-status\s*\{\s*background: rgba\(16,185,129,0\.12\);\s*color: var\(--text-primary\);\s*\}/g, '');

// The broken code was placed right after .pipe-step:hover { background: var(--bg-card-hover); }
// Let's replace .pipe-step:hover entirely with the block
css = css.replace(/\.pipe-step:hover\s*\{\s*background: var\(--bg-card-hover\);\s*\}/, correctCSS);

fs.writeFileSync(cssPath, css);
console.log("Fixed broken CSS!");
