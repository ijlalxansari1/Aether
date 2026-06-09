import GlobalSidebar from '@/components/GlobalSidebar';

export default function IntegrationsPage() {
  return (
    <div className="app-layout">
      <GlobalSidebar />
      <div className="app-root" style={{ padding: '40px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Integrations</h1>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Manage your enterprise data connectors and APIs.</p>
      </div>
    </div>
  );
}
