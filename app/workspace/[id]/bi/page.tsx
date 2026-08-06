'use client';

import { useWorkspace } from '@/components/WorkspaceContext';
import DashboardStage from '@/components/stages/DashboardStage';

import { useRouter } from 'next/navigation';

export default function BusinessIntelligencePage() {
  const { dataset, cleanedRows, headers, types, userRole, loading } = useWorkspace();
  const router = useRouter();
  const isReadOnly = userRole !== 'bi' && userRole !== 'admin';

  if (loading) return null;

  return (
    <>
      {isReadOnly && <div style={{ background: 'var(--bg-card)', padding: '16px', color: 'var(--text-muted)' }}>Viewing in Read-Only mode. Only BI Engineers can modify the dashboard layout.</div>}
      <DashboardStage 
        rows={cleanedRows} 
        headers={headers} 
        types={types}
        filename={dataset?.name || 'Workspace'}
        onProceed={() => router.push(`/workspace/${dataset?.id}/ml`)}
      />
    </>
  );
}
