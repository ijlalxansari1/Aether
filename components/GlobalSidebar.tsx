'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function GlobalSidebar() {
  const pathname = usePathname();
  return (
    <aside className="global-sidebar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 8px' }}>
        <img src="/logo.svg" alt="AETHER Logo" style={{ width: '32px', height: '32px' }} />
        <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '0.5px' }}>Aether</span>
        <span style={{ background: 'var(--violet-dim)', color: 'var(--violet)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px', marginTop: '2px' }}>v1.0</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group">
          <div className="nav-label">Platform</div>
          <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>
            <span className="nav-icon">📊</span>
            Pipelines
          </Link>
          <Link href="/ethics" className={`nav-item ${pathname === '/ethics' ? 'active' : ''}`}>
            <span className="nav-icon">⚖️</span>
            Ethics & Governance
          </Link>
          <Link href="/architecture" className={`nav-item ${pathname === '/architecture' ? 'active' : ''}`}>
            <span className="nav-icon">🗺️</span>
            Architecture
          </Link>
          <Link href="/copilot" className={`nav-item ${pathname === '/copilot' ? 'active' : ''}`}>
            <span className="nav-icon">🤖</span>
            AI Copilot
          </Link>
        </div>

        <div className="nav-group">
          <div className="nav-label">Settings</div>
          <Link href="/integrations" className={`nav-item ${pathname === '/integrations' ? 'active' : ''}`}>
            <span className="nav-icon">🔌</span>
            Integrations
          </Link>
          <Link href="/preferences" className={`nav-item ${pathname === '/preferences' ? 'active' : ''}`}>
            <span className="nav-icon">⚙️</span>
            Preferences
          </Link>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="system-status">
          <span className="status-dot"></span>
          All Systems Operational
        </div>
      </div>
    </aside>
  );
}
