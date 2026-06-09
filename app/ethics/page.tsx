import GlobalSidebar from '@/components/GlobalSidebar';

export default function EthicsPage() {
  return (
    <div className="app-layout">
      <GlobalSidebar />
      <div className="app-root" style={{ padding: '40px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Ethics & Governance</h1>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>This module is currently under development.</p>
      </div>
    </div>
  );
}
