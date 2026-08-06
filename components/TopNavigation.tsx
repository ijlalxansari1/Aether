'use client';

import { useRouter } from 'next/navigation';

export default function TopNavigation() {
  const router = useRouter();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 24px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-surface)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      <button 
        onClick={() => router.back()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          transition: 'var(--transition)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
        title="Go Back"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>

      <button 
        onClick={() => router.forward()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          transition: 'var(--transition)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
        title="Go Forward"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>

      <div style={{ flex: 1 }} />
      
      {/* Optional: Add search bar, user profile, or breadcrumbs here if needed later */}
    </div>
  );
}
