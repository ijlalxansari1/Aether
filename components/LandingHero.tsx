'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface HeroProps {
  onScroll: () => void;
  hasSavedSession?: boolean;
  onResume?: () => void;
}

const FEATURES = [
  { icon: '⬆', label: 'Ingest',    color: '#00d4ff', desc: 'CSV · JSON · Paste · Drag & drop' },
  { icon: '🗄', label: 'Store',     color: '#7c3aed', desc: 'Schema detection · Sort · Filter' },
  { icon: '🧹', label: 'Clean',     color: '#10b981', desc: 'Nulls · Dupes · Outliers · Regex' },
  { icon: '📊', label: 'Analyze',   color: '#f59e0b', desc: 'Scatter · Box plot · Correlation' },
  { icon: '📖', label: 'Story',     color: '#ec4899', desc: 'Auto-generated data narrative' },
  { icon: '📈', label: 'Dashboard', color: '#6366f1', desc: 'KPIs · Bar · Donut · Trend' },
  { icon: '📋', label: 'BI Report', color: '#00d4ff', desc: 'PDF · HTML · CSV · Share link' },
];

const STATS = [
  { val: '7',    label: 'Pipeline Stages' },
  { val: '6+',   label: 'Chart Types' },
  { val: '∞',    label: 'Rows Supported' },
  { val: '100%', label: 'Browser Native' },
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

export default function LandingHero({ onScroll, hasSavedSession, onResume }: HeroProps) {
  const [tick, setTick] = useState(0);

  // Cycle through features for the live preview ticker
  useEffect(() => {
    const id = setInterval(() => setTick(t => (t + 1) % FEATURES.length), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hero-root hero-visible">
      {/* Animated background orbs */}
      <div className="hero-orb orb-1" />
      <div className="hero-orb orb-2" />
      <div className="hero-orb orb-3" />

      {/* ── Hero copy ── */}
      <motion.div 
        className="hero-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="hero-eyebrow">
          <span className="eyebrow-dot" />
          End-to-End DataOps Platform
          <span className="eyebrow-badge">MVP v1.0</span>
        </motion.div>

        <motion.h1 variants={itemVariants} className="hero-headline">
          Turn raw data into
          <br />
          <span className="hero-gradient">insight, instantly.</span>
        </motion.h1>

        <motion.p variants={itemVariants} className="hero-body">
          Aether is a browser-native DataOps pipeline — ingest, store, clean, analyze,
          narrate, and report your data through a single beautiful interface.
          <strong> No backend. No setup. Just results.</strong>
        </motion.p>

        {/* Live ticker */}
        <motion.div variants={itemVariants} className="hero-ticker">
          <span className="ticker-label">Now running →</span>
          <motion.span 
            className="ticker-stage" 
            key={tick} 
            style={{ color: FEATURES[tick].color }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {FEATURES[tick].icon} {FEATURES[tick].label}
          </motion.span>
          <span className="ticker-desc">{FEATURES[tick].desc}</span>
        </motion.div>

        {/* CTAs */}
        <motion.div variants={itemVariants} className="hero-ctas">
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            className="btn btn-primary hero-cta-primary" 
            onClick={onScroll}
          >
            🚀 Start Pipeline
          </motion.button>
          {hasSavedSession && onResume && (
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className="btn btn-secondary hero-cta-secondary" 
              style={{ borderColor: 'var(--emerald)', color: 'var(--emerald)' }} 
              onClick={onResume}
            >
              ♻️ Resume Workspace
            </motion.button>
          )}
          <motion.a
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            className="btn btn-secondary hero-cta-secondary"
            href="https://github.com/ijlalxansari1/Aether"
            target="_blank"
            rel="noreferrer"
          >
            ⭐ GitHub
          </motion.a>
        </motion.div>

        {/* Stats */}
        <motion.div variants={itemVariants} className="hero-stats">
          {STATS.map(s => (
            <div key={s.label} className="hero-stat">
              <div className="hero-stat-val">{s.val}</div>
              <div className="hero-stat-label">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Scroll cue ── */}
      <motion.div 
        className="hero-scroll-cue" 
        onClick={onScroll}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        <span>Start ingesting data</span>
        <motion.div 
          className="scroll-arrow"
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          ↓
        </motion.div>
      </motion.div>
    </div>
  );
}
