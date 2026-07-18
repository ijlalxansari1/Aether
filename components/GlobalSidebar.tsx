'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

export default function GlobalSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);

  const sidebarVariants: any = {
    expanded: { width: 240, transition: { duration: 0.3, ease: 'easeInOut' } },
    collapsed: { width: 68, transition: { duration: 0.3, ease: 'easeInOut' } }
  };

  const textVariants = {
    expanded: { opacity: 1, display: 'block', transition: { delay: 0.1 } },
    collapsed: { opacity: 0, display: 'none', transition: { duration: 0.1 } }
  };

  return (
    <motion.aside 
      className="global-sidebar"
      variants={sidebarVariants}
      initial="collapsed"
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
      style={{
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        zIndex: 50,
        flexShrink: 0,
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 18px', whiteSpace: 'nowrap' }}>
        <img src="/logo.svg" alt="AETHER Logo" style={{ width: '32px', height: '32px', flexShrink: 0 }} />
        <motion.div variants={textVariants} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-primary)' }}>Aether</span>
        </motion.div>
      </div>

      <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 12px', flex: 1 }}>
        <SidebarItem href="/" icon="📊" label="Pipelines" active={pathname === '/'} isCollapsed={isCollapsed} />
        <SidebarItem href="/ethics" icon="⚖️" label="Ethics & Gov" active={pathname === '/ethics'} isCollapsed={isCollapsed} />
        <SidebarItem href="/architecture" icon="🗺️" label="Architecture" active={pathname === '/architecture'} isCollapsed={isCollapsed} />
        <SidebarItem href="/copilot" icon="🤖" label="AI Copilot" active={pathname === '/copilot'} isCollapsed={isCollapsed} />
        
        <div style={{ margin: '24px 0 8px 0', borderTop: '1px solid var(--border)' }} />
        
        <SidebarItem href="/integrations" icon="🔌" label="Integrations" active={pathname === '/integrations'} isCollapsed={isCollapsed} />
        <SidebarItem href="/preferences" icon="⚙️" label="Preferences" active={pathname === '/preferences'} isCollapsed={isCollapsed} />
      </nav>

      <div style={{ padding: '0 12px', marginTop: 'auto' }}>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '12px', 
          padding: '12px', borderRadius: '8px', 
          background: 'rgba(16, 185, 129, 0.1)', color: 'var(--emerald)' 
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--emerald)', flexShrink: 0, boxShadow: '0 0 8px var(--emerald)' }} />
          <motion.span variants={textVariants} style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
            System Online
          </motion.span>
        </div>
      </div>
    </motion.aside>
  );
}

function SidebarItem({ href, icon, label, active, isCollapsed }: { href: string, icon: string, label: string, active: boolean, isCollapsed: boolean }) {
  const textVariants = {
    expanded: { opacity: 1, display: 'block', transition: { delay: 0.1 } },
    collapsed: { opacity: 0, display: 'none', transition: { duration: 0.1 } }
  };

  return (
    <Link href={href} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '12px',
      borderRadius: '8px',
      background: active ? 'var(--bg-card-hover)' : 'transparent',
      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      textDecoration: 'none',
      transition: 'var(--transition)',
      border: active ? '1px solid var(--border-active)' : '1px solid transparent',
      whiteSpace: 'nowrap'
    }}
    onMouseEnter={(e) => {
      if (!active) {
        e.currentTarget.style.background = 'var(--bg-card)';
        e.currentTarget.style.color = 'var(--text-primary)';
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }
    }}>
      <span style={{ fontSize: '20px', flexShrink: 0 }}>{icon}</span>
      <motion.span variants={textVariants} style={{ fontSize: '14px', fontWeight: 500 }}>
        {label}
      </motion.span>
    </Link>
  );
}
