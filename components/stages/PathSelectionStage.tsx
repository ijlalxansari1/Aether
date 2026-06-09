'use client';

import { UserPath } from '@/lib/types';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface PathSelectionStageProps {
  onSelectPath: (path: UserPath) => void;
}

const PATHS = [
  {
    id: 'analyst' as UserPath,
    icon: '📊',
    title: 'Data Analyst',
    desc: 'Dive deep into the data. Create scatter plots, box plots, find correlations, and generate data narratives.',
    flow: 'Analyze → Story',
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.1)'
  },
  {
    id: 'bi' as UserPath,
    icon: '📈',
    title: 'BI Engineer',
    desc: 'Build executive dashboards. Create KPIs, bar charts, donut charts, and export beautiful BI Reports.',
    flow: 'Dashboard → BI Report',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)'
  },
  {
    id: 'ds' as UserPath,
    icon: '🧠',
    title: 'Data Scientist',
    desc: 'Train machine learning models. Evaluate model metrics, tune hyperparameters, and deploy to production.',
    flow: 'Model → Evaluate → Deploy',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.1)'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.1, delayChildren: 0.1 } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
};

export default function PathSelectionStage({ onSelectPath }: PathSelectionStageProps) {
  const [hovered, setHovered] = useState<UserPath | null>(null);

  return (
    <motion.div 
      className="stage-content"
      style={{ maxWidth: '1200px', margin: '0 auto' }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      
      {/* Top Header */}
      <motion.div variants={itemVariants} style={{ marginBottom: '48px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99,102,241,0.15)', color: 'var(--accent)', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, marginBottom: '20px', border: '1px solid rgba(99,102,241,0.3)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)' }} />
          Data Engineering Complete
        </div>
        <h1 style={{ fontSize: '40px', fontWeight: 800, margin: '0 0 16px 0', letterSpacing: '-0.04em' }}>
          Choose Your <span style={{ background: 'linear-gradient(90deg, var(--cyan), var(--violet))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Path</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '18px', maxWidth: '600px', marginInline: 'auto', lineHeight: 1.6 }}>
          Your pipeline has processed the data. Select your persona to enter the next phase of the workflow.
        </p>
      </motion.div>

      {/* Path Cards Grid */}
      <motion.div 
        variants={itemVariants}
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '24px',
          perspective: '1000px'
        }}
      >
        {PATHS.map((p) => (
          <motion.div 
            key={p.id}
            onClick={() => onSelectPath(p.id)}
            onHoverStart={() => setHovered(p.id)}
            onHoverEnd={() => setHovered(null)}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="card"
            style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textAlign: 'center',
              padding: '40px 32px',
              position: 'relative',
              overflow: 'hidden',
              borderColor: hovered === p.id ? p.color : 'rgba(255,255,255,0.08)',
              boxShadow: hovered === p.id ? `0 10px 30px ${p.color}30, inset 0 1px 1px rgba(255,255,255,0.1)` : 'inset 0 1px 1px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.4)',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Hover Glow Background */}
            <motion.div
              initial={false}
              animate={{ opacity: hovered === p.id ? 1 : 0 }}
              style={{
                position: 'absolute',
                top: '-50%', left: '-50%', width: '200%', height: '200%',
                background: `radial-gradient(circle at center, ${p.bg}, transparent 60%)`,
                zIndex: 0,
                pointerEvents: 'none'
              }}
            />

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <motion.div 
                animate={{ rotate: hovered === p.id ? [0, -10, 10, 0] : 0 }}
                transition={{ duration: 0.5 }}
                style={{ width: '80px', height: '80px', background: p.bg, borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', marginBottom: '32px', border: `1px solid ${p.color}40`, boxShadow: `0 0 20px ${p.bg}` }}
              >
                {p.icon}
              </motion.div>
              
              <h3 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>{p.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 32px 0', lineHeight: 1.6 }}>
                {p.desc}
              </p>
              
              <div style={{ 
                marginTop: 'auto', 
                background: hovered === p.id ? p.color : 'rgba(255,255,255,0.05)', 
                color: hovered === p.id ? '#000' : p.color, 
                padding: '8px 16px', 
                borderRadius: '12px', 
                fontSize: '12px', 
                fontWeight: 700,
                letterSpacing: '0.5px',
                transition: 'all 0.3s ease',
                border: hovered === p.id ? `1px solid ${p.color}` : '1px solid rgba(255,255,255,0.1)'
              }}>
                {p.flow}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

    </motion.div>
  );
}
