const fs = require('fs');
let css = fs.readFileSync('app/globals.css', 'utf-8');

// 1. Replace variables
css = css.replace(/:root \{[\s\S]*?\}/, `:root {
  --bg-base:        #f8fafc;
  --bg-surface:     #ffffff;
  --bg-card:        #ffffff;
  --bg-card-hover:  #f1f5f9;
  --border:         #e2e8f0;
  --border-active:  #3b82f6;

  --cyan:           #0ea5e9;
  --cyan-dim:       #e0f2fe;
  --violet:         #8b5cf6;
  --violet-dim:     #ede9fe;
  --emerald:        #10b981;
  --amber:          #f59e0b;
  --rose:           #f43f5e;

  --text-primary:   #0f172a;
  --text-secondary: #475569;
  --text-muted:     #94a3b8;

  --radius-sm:  8px;
  --radius-md:  16px;
  --radius-lg:  24px;
  --radius-xl:  32px;
  --transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
}`);

// 2. Body background
css = css.replace(/radial-gradient\(ellipse 60% 60%.*?,/g, 'radial-gradient(ellipse 60% 60% at 50% -10%, rgba(139, 92, 246, 0.08) 0%, transparent 70%),');
css = css.replace(/radial-gradient\(ellipse 50% 50%.*?\);/g, 'radial-gradient(ellipse 50% 50% at 80% 90%, rgba(14, 165, 233, 0.08) 0%, transparent 60%);');

// 3. Topbar
css = css.replace(/rgba\(0, 0, 0, 0\.4\)/g, 'rgba(255, 255, 255, 0.8)');
css = css.replace(/box-shadow: 0 4px 40px rgba\(0,0,0,0\.8\)/g, 'box-shadow: 0 4px 40px rgba(0,0,0,0.05)');

// 4. Badges (adjust colors for light theme)
css = css.replace(/border: 1px solid rgba\(0,212,255,0\.3\)/g, 'border: 1px solid rgba(14, 165, 233, 0.2)');
css = css.replace(/border: 1px solid rgba\(124,58,237,0\.3\)/g, 'border: 1px solid rgba(139, 92, 246, 0.2)');

// 5. Card styles
css = css.replace(/box-shadow: inset 0 0 0 1px rgba\(255, 255, 255, 0\.05\), 0 10px 40px rgba\(0, 0, 0, 0\.4\);/g, 'box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);');
css = css.replace(/box-shadow: 0 12px 40px rgba\(0,0,0,0\.3\);/g, 'box-shadow: 0 8px 30px rgba(0,0,0,0.06);');

// 6. Buttons
css = css.replace(/color: #000;/g, 'color: #fff;');
css = css.replace(/box-shadow: 0 4px 24px rgba\(0, 240, 255, 0\.3\);/g, 'box-shadow: 0 4px 14px rgba(14, 165, 233, 0.3);');

// 7. Inputs/Textareas
css = css.replace(/background: rgba\(0,0,0,0\.35\)/g, 'background: #ffffff');
css = css.replace(/background: rgba\(0,0,0,0\.3\)/g, 'background: #ffffff');

// 8. Ingest Log
css = css.replace(/color: var\(--emerald\);/g, 'color: var(--text-primary);');

// 9. Tables
css = css.replace(/border-bottom: 1px solid rgba\(255,255,255,0\.03\)/g, 'border-bottom: 1px solid var(--border)');
css = css.replace(/rgba\(255,255,255,0\.04\)/g, 'var(--border)');

// 10. Dashboard/KPI
css = css.replace(/box-shadow: 0 8px 24px rgba\(0,0,0,0\.15\);/g, 'box-shadow: 0 4px 20px rgba(0,0,0,0.04);');

// 11. Tooltips / Modals
css = css.replace(/background: rgba\(8,8,24,0\.95\)/g, 'background: #ffffff');

// Save back
fs.writeFileSync('app/globals.css', css);
console.log('CSS Updated!');
