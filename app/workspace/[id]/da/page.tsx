'use client';

import { useWorkspace } from '@/components/WorkspaceContext';
import AnalyzeStage from '@/components/stages/AnalyzeStage';
import { useRouter } from 'next/navigation';

export default function DataAnalysisPage() {
  const { datasetId, cleanedRows, headers, types, userRole, loading } = useWorkspace();
  const router = useRouter();
  const isReadOnly = userRole !== 'da' && userRole !== 'admin';

  if (loading) return null;

  return (
    <>
      {isReadOnly && <div style={{ background: 'var(--bg-card)', padding: '16px', color: 'var(--text-muted)' }}>Viewing in Read-Only mode. Only Data Analysts can write persistent queries.</div>}
      <AnalyzeStage 
        rows={cleanedRows} 
        headers={headers} 
        types={types}
        onProceed={() => router.push(`/workspace/${datasetId}/bi`)}
      />
    </>
  );
}
