const fs = require('fs');
const path = require('path');

// 1. UPDATE globals.css
const cssPath = path.join(__dirname, 'app/globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

// The current :root has the slate theme. We will move this to [data-theme="slate"]
// Then add [data-theme="dark"] and [data-theme="light"]
const themeCSS = `
/* ── Themes ─────────────────────────────────────────────── */
:root, [data-theme="dark"] {
  /* Pitch Black Dark Theme (Loki/Void style but labeled Dark) */
  --bg-base:        #000000;
  --bg-surface:     #0A0A0A;
  --bg-card:        #121212;
  --bg-card-hover:  #1A1A1A;
  --border:         rgba(255, 255, 255, 0.1);
  --border-active:  rgba(255, 255, 255, 0.2);

  --accent:         #6366F1;
  --accent-hover:   #818cf8;

  --cyan:           #06b6d4;
  --cyan-dim:       rgba(6, 182, 212, 0.15);
  --violet:         #8b5cf6;
  --violet-dim:     rgba(139, 92, 246, 0.15);
  --emerald:        #10b981;
  --amber:          #f59e0b;
  --rose:           #ef4444;
  --sky:            #38bdf8;

  --text-primary:   #FFFFFF;
  --text-secondary: #A1A1AA;
  --text-muted:     #71717A;

  --radius-sm:  8px;
  --radius-md:  8px;
  --radius-lg:  12px;
  --radius-xl:  16px;
  --transition: all 0.2s ease;
  
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.4);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.5);
  --shadow-lg: 0 12px 32px rgba(0,0,0,0.6);
  --shadow-glow: none;
}

[data-theme="slate"] {
  /* Slate-inspired Deep Dark Theme */
  --bg-base:        #0F111A;
  --bg-surface:     #161822;
  --bg-card:        #1B1E2B;
  --bg-card-hover:  #222636;
  --border:         #2A2F42;
  --border-active:  #383F57;

  --text-primary:   #F8FAFC;
  --text-secondary: #94A3B8;
  --text-muted:     #64748B;
}

[data-theme="light"] {
  /* Crisp Light Theme */
  --bg-base:        #F8FAFC;
  --bg-surface:     #FFFFFF;
  --bg-card:        #FFFFFF;
  --bg-card-hover:  #F1F5F9;
  --border:         #E2E8F0;
  --border-active:  #CBD5E1;

  --text-primary:   #0F172A;
  --text-secondary: #475569;
  --text-muted:     #64748B;
  
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
}
`;

// Replace everything from :root { up to } with our new themes
css = css.replace(/:root\s*\{[\s\S]*?--shadow-glow:[^}]*\}/, themeCSS.trim());
fs.writeFileSync(cssPath, css);


// 2. CREATE ThemeProvider.tsx
const providerCode = `
'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'slate';

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'slate', setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('slate');

  useEffect(() => {
    const saved = localStorage.getItem('aether-theme') as Theme;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      document.documentElement.setAttribute('data-theme', 'slate');
    }
  }, []);

  const handleSetTheme = (t: Theme) => {
    setTheme(t);
    localStorage.setItem('aether-theme', t);
    document.documentElement.setAttribute('data-theme', t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
`;
fs.writeFileSync(path.join(__dirname, 'components/ThemeProvider.tsx'), providerCode.trim());

// 3. UPDATE layout.tsx
const layoutPath = path.join(__dirname, 'app/layout.tsx');
let layout = fs.readFileSync(layoutPath, 'utf8');
if (!layout.includes('ThemeProvider')) {
  layout = layout.replace(/import\s+.*?\s+from\s+['"]next\/font\/google['"];/, 
    "import { Inter } from 'next/font/google';\nimport { ThemeProvider } from '@/components/ThemeProvider';");
  layout = layout.replace(/{children}/, '<ThemeProvider>{children}</ThemeProvider>');
  fs.writeFileSync(layoutPath, layout);
}

// 4. UPDATE Preferences Page
const prefPath = path.join(__dirname, 'app/preferences/page.tsx');
const prefCode = `
'use client';
import GlobalSidebar from '@/components/GlobalSidebar';
import { useTheme } from '@/components/ThemeProvider';

export default function PreferencesPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="app-layout">
      <GlobalSidebar />
      <div className="app-root" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', overflowY: 'auto' }}>
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>Preferences</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Manage your platform settings and aesthetic themes.</p>
        </header>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Appearance Theme</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            
            <div 
              onClick={() => setTheme('light')}
              style={{ padding: '20px', background: '#F8FAFC', border: theme === 'light' ? '2px solid var(--accent)' : '2px solid #E2E8F0', borderRadius: '12px', cursor: 'pointer', color: '#0F172A' }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>☀️</div>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Light Theme</h3>
              <p style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>Crisp, clean, high-contrast.</p>
            </div>

            <div 
              onClick={() => setTheme('dark')}
              style={{ padding: '20px', background: '#000000', border: theme === 'dark' ? '2px solid var(--accent)' : '2px solid #333', borderRadius: '12px', cursor: 'pointer', color: '#FFF' }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🌙</div>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Dark Theme</h3>
              <p style={{ fontSize: '13px', color: '#A1A1AA', marginTop: '4px' }}>Deep black, perfect for OLED.</p>
            </div>

            <div 
              onClick={() => setTheme('slate')}
              style={{ padding: '20px', background: '#0F111A', border: theme === 'slate' ? '2px solid var(--accent)' : '2px solid #2A2F42', borderRadius: '12px', cursor: 'pointer', color: '#F8FAFC' }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🌊</div>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Slate Theme</h3>
              <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px' }}>Sophisticated dark grey-blue.</p>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
`;
fs.writeFileSync(prefPath, prefCode.trim());

console.log("Theming fully implemented.");
