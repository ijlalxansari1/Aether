import { WorkspaceProvider } from '@/components/WorkspaceContext';
import DomainSwitcher from '@/components/DomainSwitcher';

export default async function WorkspaceLayout({ children, params }: { children: React.ReactNode, params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return (
    <WorkspaceProvider initialDatasetId={resolvedParams.id}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <DomainSwitcher datasetId={resolvedParams.id} />
        <main className="app-content" style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-body)' }}>
          {children}
        </main>
      </div>
    </WorkspaceProvider>
  );
}
