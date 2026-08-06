'use client';

import { useWorkspace } from '@/components/WorkspaceContext';
import DeployStage from '@/components/stages/DeployStage';
import ModelStage from '@/components/stages/ModelStage';

export default function MachineLearningPage() {
  const { cleanedRows, headers, types, userRole, loading } = useWorkspace();
  const isReadOnly = userRole !== 'ml' && userRole !== 'admin';

  if (loading) return null;

  return (
    <>
      {isReadOnly && <div style={{ background: 'var(--bg-card)', padding: '16px', color: 'var(--text-muted)' }}>Viewing in Read-Only mode. Only ML Engineers can deploy models.</div>}
      {/* Simplify to ModelStage for standard UI demo */}
      <ModelStage 
        rows={cleanedRows} 
        headers={headers}
        types={types}
        onProceed={() => {}}
      />
    </>
  );
}
