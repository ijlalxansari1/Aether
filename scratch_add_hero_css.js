const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'app/globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

const heroCSS = `
/* ── Landing Hero ─────────────────────────────────────────────── */
.hero-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  position: relative;
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.8s ease;
}
.hero-visible { opacity: 1; }

.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  z-index: 0;
  opacity: 0.3;
}
.orb-1 { width: 400px; height: 400px; background: var(--accent); top: -100px; left: -100px; }
.orb-2 { width: 300px; height: 300px; background: var(--emerald); bottom: -50px; right: -50px; }
.orb-3 { width: 250px; height: 250px; background: var(--rose); top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.15; }

.hero-center {
  position: relative;
  z-index: 1;
  max-width: 800px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.hero-eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.05);
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid var(--border);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}
.eyebrow-dot { width: 8px; height: 8px; background: var(--emerald); border-radius: 50%; box-shadow: 0 0 10px var(--emerald); }
.eyebrow-badge { background: var(--accent); color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; margin-left: 8px; }

.hero-headline {
  font-size: clamp(40px, 6vw, 72px);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -1px;
  color: var(--text-primary);
}
.hero-gradient {
  background: linear-gradient(to right, var(--accent), var(--cyan));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-body {
  font-size: 18px;
  color: var(--text-secondary);
  max-width: 600px;
  line-height: 1.6;
}
.hero-body strong { color: var(--text-primary); font-weight: 600; }

.hero-ticker {
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 12px 24px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  box-shadow: var(--shadow-md);
}
.ticker-label { color: var(--text-muted); font-weight: 500; }
.ticker-stage { font-weight: 700; display: flex; alignItems: center; gap: 6px; }
.ticker-desc { color: var(--text-secondary); }

.hero-ctas {
  display: flex;
  gap: 16px;
  margin-top: 16px;
  flex-wrap: wrap;
  justify-content: center;
}
.hero-cta-primary { padding: 14px 32px; font-size: 16px; border-radius: 8px; box-shadow: 0 4px 15px rgba(99,102,241,0.4); }
.hero-cta-secondary { padding: 14px 24px; font-size: 16px; border-radius: 8px; text-decoration: none; display: flex; align-items: center; gap: 8px; }

.hero-stats {
  display: flex;
  gap: 40px;
  margin-top: 40px;
  border-top: 1px solid var(--border);
  padding-top: 40px;
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
}
.hero-stat { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.hero-stat-val { font-size: 32px; font-weight: 800; color: var(--text-primary); }
.hero-stat-label { font-size: 13px; color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 1px; }

.hero-features {
  display: flex;
  gap: 16px;
  margin-top: 80px;
  position: relative;
  z-index: 1;
  max-width: 1200px;
  flex-wrap: wrap;
  justify-content: center;
}
.hero-feat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 20px;
  border-radius: 12px;
  width: 160px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  transition: all 0.3s ease;
  animation: float 6s ease-in-out infinite;
}
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}
.hero-feat-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 8px; }
.hero-feat-label { font-weight: 700; font-size: 14px; color: var(--text-primary); }
.hero-feat-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.4; }
.hero-feat-arrow { position: absolute; right: -20px; top: 50%; transform: translateY(-50%); font-size: 20px; font-weight: bold; z-index: 2; opacity: 0.5; }

.hero-scroll-cue {
  position: absolute;
  bottom: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  z-index: 1;
}
.scroll-arrow { animation: bounce 2s infinite; font-size: 16px; }
@keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-10px); } 60% { transform: translateY(-5px); } }
`;

if (!css.includes('.hero-root')) {
  fs.writeFileSync(cssPath, css + '\n' + heroCSS);
}
