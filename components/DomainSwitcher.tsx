'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWorkspace } from './WorkspaceContext';
import { motion } from 'framer-motion';

export default function DomainSwitcher({ datasetId }: { datasetId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { dataset, appliedOps, userRole } = useWorkspace();

  const domains = [
    { id: 'de', label: 'Data Engineering', path: `/workspace/${datasetId}/de` },
    { id: 'da', label: 'Data Analysis', path: `/workspace/${datasetId}/da` },
    { id: 'bi', label: 'BI / Dashboards', path: `/workspace/${datasetId}/bi` },
    { id: 'ml', label: 'Machine Learning', path: `/workspace/${datasetId}/ml` },
  ];

  return (
    <div style={{ padding: '16px 32px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      {/* Domain Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {domains.map(d => {
          const isActive = pathname.includes(d.path);
          return (
            <Link
              key={d.id}
              href={d.path}
              style={{
                padding: '8px 16px',
                background: isActive ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                color: isActive ? 'var(--violet)' : 'var(--text-secondary)',
                border: isActive ? '1px solid var(--violet)' : '1px solid transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.2s',
                textDecoration: 'none'
              }}
            >
              {d.label}
            </Link>
          );
        })}
      </div>

      {/* Lineage Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>{dataset?.name || 'Loading...'}</span>
        {Array.from(appliedOps).map((op, i) => (
          <span key={op} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>→</span>
            <span style={{ background: 'var(--bg-body)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>{op}</span>
          </span>
        ))}
      </div>
      
      {/* Role Indicator (Non-strict RBAC) */}
      <div style={{ fontSize: '12px', padding: '4px 12px', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--cyan)', borderRadius: '12px', border: '1px solid var(--cyan)' }}>
        Role: {userRole.toUpperCase()} (Read-Only across Domains)
      </div>
    </div>
  );
}
