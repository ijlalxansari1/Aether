'use client';

import { useEffect, useState } from 'react';

interface HeroProps {
  onScroll: () => void;
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

export default function LandingHero({ onScroll }: HeroProps) {
  const [visible, setVisible] = useState(false);
  const [tick, setTick] = useState(0);

  // Entrance animation
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Cycle through features for the live preview ticker
  useEffect(() => {
    const id = setInterval(() => setTick(t => (t + 1) % FEATURES.length), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`hero-root ${visible ? 'hero-visible' : ''}`}>
      {/* Animated background orbs */}
      <div className="hero-orb orb-1" />
      <div className="hero-orb orb-2" />
      <div className="hero-orb orb-3" />

      {/* ── Hero copy ── */}
      <div className="hero-center">
        <div className="hero-eyebrow">
          <span className="eyebrow-dot" />
          End-to-End DataOps Platform
          <span className="eyebrow-badge">MVP v1.0</span>
        </div>

        <h1 className="hero-headline">
          Turn raw data into
          <br />
          <span className="hero-gradient">insight, instantly.</span>
        </h1>

        <p className="hero-body">
          Aether is a browser-native DataOps pipeline — ingest, store, clean, analyze,
          narrate, and report your data through a single beautiful interface.
          <strong> No backend. No setup. Just results.</strong>
        </p>

        {/* Live ticker */}
        <div className="hero-ticker">
          <span className="ticker-label">Now running →</span>
          <span className="ticker-stage" key={tick} style={{ color: FEATURES[tick].color }}>
            {FEATURES[tick].icon} {FEATURES[tick].label}
          </span>
          <span className="ticker-desc">{FEATURES[tick].desc}</span>
        </div>

        {/* CTAs */}
        <div className="hero-ctas">
          <button className="btn btn-primary hero-cta-primary" onClick={onScroll}>
            🚀 Start Pipeline
          </button>
          <a
            className="btn btn-secondary hero-cta-secondary"
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
          >
            ⭐ GitHub
          </a>
        </div>

        {/* Stats */}
        <div className="hero-stats">
          {STATS.map(s => (
            <div key={s.label} className="hero-stat">
              <div className="hero-stat-val">{s.val}</div>
              <div className="hero-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Feature cards strip ── */}
      <div className="hero-features">
        {FEATURES.map((f, i) => (
          <div
            key={f.label}
            className="hero-feat-card"
            style={{ animationDelay: `${i * 0.07}s`, borderColor: tick === i ? f.color + '60' : '' }}
          >
            <div className="hero-feat-icon" style={{ background: f.color + '18', color: f.color }}>
              {f.icon}
            </div>
            <div className="hero-feat-label">{f.label}</div>
            <div className="hero-feat-desc">{f.desc}</div>
            {i < FEATURES.length - 1 && <div className="hero-feat-arrow" style={{ color: f.color }}>→</div>}
          </div>
        ))}
      </div>

      {/* ── Scroll cue ── */}
      <div className="hero-scroll-cue" onClick={onScroll}>
        <span>Start ingesting data</span>
        <div className="scroll-arrow">↓</div>
      </div>
    </div>
  );
}
