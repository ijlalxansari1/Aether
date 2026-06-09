const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'app', 'globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Replace Root Tokens
css = css.replace(/:root\s*{[^}]*}/, `:root {
  --bg-base:        #022c22;
  --bg-surface:     #064e3b;
  --bg-card:        #065f46;
  --bg-card-hover:  #047857;
  --border:         #0f766e;
  --border-active:  #f59e0b;

  --cyan:           #fbbf24;
  --cyan-dim:       rgba(251, 191, 36, 0.15);
  --violet:         #f97316;
  --violet-dim:     rgba(249, 115, 22, 0.15);
  --emerald:        #34d399;
  --amber:          #fbbf24;
  --rose:           #fb7185;

  --text-primary:   #f0fdf4;
  --text-secondary: #a7f3d0;
  --text-muted:     #6ee7b7;

  --radius-sm:  8px;
  --radius-md:  16px;
  --radius-lg:  24px;
  --radius-xl:  32px;
  --transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
}`);

// Replace body background gradient
css = css.replace(/radial-gradient.*?transparent 60%\);/s, `radial-gradient(ellipse 60% 60% at 50% -10%, rgba(249, 115, 22, 0.15) 0%, transparent 70%),
    radial-gradient(ellipse 50% 50% at 80% 90%, rgba(251, 191, 36, 0.15) 0%, transparent 60%);`);

// Replace box-shadows to dark mode shadows
css = css.replace(/box-shadow:.*?rgba\(0,0,0,0\.05\);/g, `box-shadow: 0 8px 32px rgba(0,0,0,0.3);`);
css = css.replace(/box-shadow:.*?rgba\(0,0,0,0\.08\);/g, `box-shadow: 0 12px 48px rgba(0,0,0,0.4);`);

// Update PDF export color in DashboardStage
const dashPath = path.join(__dirname, 'components', 'stages', 'DashboardStage.tsx');
if (fs.existsSync(dashPath)) {
  let dash = fs.readFileSync(dashPath, 'utf8');
  dash = dash.replace(/backgroundColor:\s*'#f8fafc'/, "backgroundColor: '#022c22'");
  fs.writeFileSync(dashPath, dash);
}

fs.writeFileSync(cssPath, css);
console.log('Theme successfully changed to Dark Teal Sunrise!');
