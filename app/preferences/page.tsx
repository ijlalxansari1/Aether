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