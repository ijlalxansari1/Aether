'use client';

import { useState, useMemo } from 'react';
import { DataRow, DataSchema, DataUnderstanding, ColumnType } from '@/lib/types';
import { analyzeDataset, getDomainLabel } from '@/lib/dataUnderstanding';
import { exportCSV } from '@/lib/dataUtils';
import { determineIngestionStrategy, SOURCE_REGISTRY } from '@/lib/sourceRegistry';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ChevronDown, ChevronUp, AlertTriangle, Sparkles, ArrowRight, Shield, TrendingUp, BarChart3, Brain, Search, Server } from 'lucide-react';

interface DiscoveryStageProps {
  headers: string[];
  rows: DataRow[];
  filename: string;
  ingestedAt: Date | null;
  quarantinedCount: number;
  sourceType?: import('@/lib/sourceRegistry').SourceType;
  onProceed: () => void;
  onNavigate: (stage: string) => void;
}

export default function DiscoveryStage({ headers, rows, filename, ingestedAt, quarantinedCount, sourceType = 'csv', onProceed, onNavigate }: DiscoveryStageProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showEvidence, setShowEvidence] = useState<string | null>(null);

  // Run the Data Understanding Engine
  const understanding = useMemo(() => analyzeDataset(headers, rows), [headers, rows]);

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const CATEGORY_ICON: Record<string, any> = {
    quality: <Shield size={18} />,
    analysis: <TrendingUp size={18} />,
    dashboard: <BarChart3 size={18} />,
    prediction: <Brain size={18} />,
    governance: <AlertTriangle size={18} />
  };

  const CATEGORY_COLOR: Record<string, string> = {
    quality: 'var(--amber)',
    analysis: 'var(--cyan)',
    dashboard: 'var(--emerald)',
    prediction: 'var(--violet)',
    governance: 'var(--rose)'
  };

  const SEMANTIC_LABELS: Record<string, { label: string; color: string; icon: string }> = {
    identifier: { label: 'ID', color: '#64748b', icon: '🔑' },
    dimension: { label: 'Dimension', color: '#8b5cf6', icon: '📊' },
    measure: { label: 'Measure', color: '#06b6d4', icon: '#' },
    temporal: { label: 'Temporal', color: '#f59e0b', icon: '📅' },
    categorical: { label: 'Category', color: '#10b981', icon: '🏷️' },
    currency: { label: 'Currency', color: '#22c55e', icon: '💰' },
    percentage: { label: 'Percent', color: '#14b8a6', icon: '%' },
    email: { label: 'Email', color: '#ef4444', icon: '📧' },
    phone: { label: 'Phone', color: '#ef4444', icon: '📱' },
    name: { label: 'Name', color: '#f97316', icon: '👤' },
    geo: { label: 'Geographic', color: '#3b82f6', icon: '🌍' },
    text: { label: 'Text', color: '#94a3b8', icon: 'A' },
    address: { label: 'Address', color: '#f97316', icon: '📍' },
    unknown: { label: 'Unknown', color: '#475569', icon: '?' },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
  };

  // Categorized field counts
  const fieldCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    understanding.schema.forEach(col => {
      const sem = col.semanticType;
      if (['measure', 'currency', 'percentage'].includes(sem)) counts['numerical'] = (counts['numerical'] || 0) + 1;
      else if (['dimension', 'categorical'].includes(sem)) counts['categorical'] = (counts['categorical'] || 0) + 1;
      else if (sem === 'temporal') counts['temporal'] = (counts['temporal'] || 0) + 1;
      else if (sem === 'identifier') counts['identifier'] = (counts['identifier'] || 0) + 1;
      else if (['email', 'phone', 'name', 'address'].includes(sem)) counts['sensitive'] = (counts['sensitive'] || 0) + 1;
      else counts['other'] = (counts['other'] || 0) + 1;
    });
    return counts;
  }, [understanding]);

  // Size estimation
  const bytes = JSON.stringify(rows).length;
  const sizeLabel = bytes > 1_000_000 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;

  // Quality score
  const qualityScore = Math.round(
    understanding.completeness * 0.5 +
    (100 - understanding.duplicatePercent) * 0.3 +
    (understanding.outlierCount === 0 ? 20 : Math.max(0, 20 - understanding.outlierCount * 0.5))
  );
  const qualityColor = qualityScore >= 80 ? 'var(--emerald)' : qualityScore >= 60 ? 'var(--amber)' : 'var(--rose)';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="stage-content"
      style={{ maxWidth: '1200px', margin: '0 auto', color: 'var(--text-primary)', fontFamily: 'system-ui, sans-serif' }}
    >

      {/* ─── HERO: "Aether understood your data" ─────────────────────────── */}
      <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.15)', color: 'var(--emerald)', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, marginBottom: '20px', border: '1px solid rgba(16,185,129,0.3)' }}>
          <Sparkles size={14} />
          Data Understanding Complete
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, var(--emerald))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Aether understood your data
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '16px' }}>
          Every operation below has a reason. Data adapts the workflow — not the workflow constraining the data.
        </p>
      </motion.div>

      {/* ─── DATASET SUMMARY CARD ─────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="card" style={{ marginBottom: '24px', padding: '28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Dataset</div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>{filename}</h2>
            <div style={{ fontSize: '16px', color: 'var(--cyan)', fontWeight: 600 }}>
              {understanding.rowCount.toLocaleString()} rows · {understanding.columnCount} columns · {sizeLabel}
            </div>
          </div>
          {understanding.domain !== 'generic' && (
            <div style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent)', padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, border: '1px solid rgba(99,102,241,0.3)', whiteSpace: 'nowrap' }}>
              {getDomainLabel(understanding.domain)} · {Math.round(understanding.domainConfidence * 100)}% confidence
            </div>
          )}
        </div>

        {/* Field type breakdown */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          {fieldCounts.numerical && (
            <div style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', color: 'var(--cyan)', fontWeight: 600 }}>
              # {fieldCounts.numerical} numerical
            </div>
          )}
          {fieldCounts.categorical && (
            <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', color: 'var(--violet)', fontWeight: 600 }}>
              🏷️ {fieldCounts.categorical} categorical
            </div>
          )}
          {fieldCounts.temporal && (
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', color: 'var(--amber)', fontWeight: 600 }}>
              📅 {fieldCounts.temporal} temporal
            </div>
          )}
          {fieldCounts.identifier && (
            <div style={{ background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>
              🔑 {fieldCounts.identifier} identifier{fieldCounts.identifier > 1 ? 's' : ''}
            </div>
          )}
          {understanding.derivableMetrics.length > 0 && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', color: 'var(--emerald)', fontWeight: 600 }}>
              ✨ {understanding.derivableMetrics.length} derived metric{understanding.derivableMetrics.length > 1 ? 's' : ''} possible
            </div>
          )}
        </div>

        {/* Quality quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>COMPLETENESS</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: understanding.completeness >= 95 ? 'var(--emerald)' : understanding.completeness >= 80 ? 'var(--amber)' : 'var(--rose)' }}>
              {understanding.completeness}%
            </div>
          </div>
          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>DUPLICATES</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: understanding.duplicateCount === 0 ? 'var(--emerald)' : 'var(--amber)' }}>
              {understanding.duplicateCount.toLocaleString()}
            </div>
          </div>
          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>OUTLIERS</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: understanding.outlierCount === 0 ? 'var(--emerald)' : 'var(--amber)' }}>
              {understanding.outlierCount.toLocaleString()}
            </div>
          </div>
          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>QUALITY SCORE</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: qualityColor }}>
              {qualityScore}/100
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── WARNINGS ────────────────────────────────────────────────── */}
      {understanding.warnings.length > 0 && (
        <motion.div variants={itemVariants} style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {understanding.warnings.filter(w => w.severity !== 'info').map((warning, idx) => (
            <div key={idx} style={{
              padding: '14px 20px',
              borderRadius: '10px',
              display: 'flex', alignItems: 'flex-start', gap: '12px',
              background: warning.severity === 'critical' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
              border: `1px solid ${warning.severity === 'critical' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
            }}>
              <AlertTriangle size={16} style={{ color: warning.severity === 'critical' ? 'var(--rose)' : 'var(--amber)', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{warning.message}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{warning.evidence}</div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* ─── CORRUPT DATA BANNER ──────────────────────────────────────── */}
      {quarantinedCount > 0 && (
        <motion.div variants={itemVariants} style={{
          padding: '16px 20px',
          borderRadius: '10px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'center', gap: '12px',
          marginBottom: '24px'
        }}>
          <AlertTriangle size={18} style={{ color: 'var(--rose)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--rose)' }}>
              {quarantinedCount} corrupted row{quarantinedCount > 1 ? 's' : ''} quarantined
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Rows with &gt;80% empty fields were automatically separated. You can review or drop them in the Data Quality stage.
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── PROGRESSIVE WORKFLOW RECOMMENDATIONS & INTELLIGENCE PANEL ──── */}
      <motion.div variants={itemVariants} style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>Progressive Operational Workflow</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>Recommended actions dynamically enabled based on dataset profiling.</p>
          </div>
          <button className="btn btn-primary" onClick={onProceed} style={{ background: 'linear-gradient(135deg, var(--cyan), var(--accent))', color: '#fff', padding: '12px 24px', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Continue to Quality <ArrowRight size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Left Column: Recommendations */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {understanding.recommendations
              .filter(r => r.id !== 'no_prediction')
              .map((rec, idx) => {
                const color = CATEGORY_COLOR[rec.category] || 'var(--cyan)';
                const isSelected = showEvidence === rec.id || (!showEvidence && idx === 0);

                return (
                  <motion.div
                    key={rec.id}
                    onClick={() => setShowEvidence(rec.id)}
                    whileHover={{ borderColor: color, boxShadow: `0 4px 20px ${color}10` }}
                    className="card"
                    style={{
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      borderColor: isSelected ? color : 'var(--border)',
                      background: isSelected ? 'rgba(255,255,255,0.02)' : 'var(--bg-surface)'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '36px', height: '36px',
                        background: isSelected ? color : `${color}15`,
                        color: isSelected ? '#000' : color,
                        borderRadius: '8px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', flexShrink: 0,
                        fontSize: '14px', fontWeight: 800
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{rec.title}</h3>
                          <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, background: `${color}15`, color, textTransform: 'uppercase' }}>
                            {rec.estimatedImpact} impact
                          </span>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: 1.5 }}>{rec.description}</p>
                        
                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                          {rec.category === 'quality' && (
                            <button className="btn btn-xs" onClick={(e) => { e.stopPropagation(); onNavigate('clean'); }} style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.2)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                              Open Data Quality
                            </button>
                          )}
                          {rec.category === 'analysis' && (
                            <button className="btn btn-xs" onClick={(e) => { e.stopPropagation(); onNavigate('analyze'); }} style={{ background: 'rgba(6,182,212,0.1)', color: 'var(--cyan)', border: '1px solid rgba(6,182,212,0.2)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                              Open Analysis
                            </button>
                          )}
                          {rec.category === 'dashboard' && (
                            <button className="btn btn-xs" onClick={(e) => { e.stopPropagation(); onNavigate('dashboard'); }} style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--emerald)', border: '1px solid rgba(16,185,129,0.2)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                              Open Dashboard
                            </button>
                          )}
                          {rec.category === 'prediction' && (
                            <button className="btn btn-xs" onClick={(e) => { e.stopPropagation(); onNavigate('model'); }} style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--violet)', border: '1px solid rgba(139,92,246,0.2)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                              Open ML modeler
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

            {/* ML not recommended card */}
            {understanding.recommendations.filter(r => r.id === 'no_prediction').map(rec => (
              <div key={rec.id} style={{ padding: '16px 20px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '32px', height: '32px', background: 'rgba(100,116,139,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}>
                  <Brain size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>{rec.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{rec.reason}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Aether Intelligence Panel */}
          <div className="card" style={{ padding: '24px', background: 'rgba(255,255,255,0.01)', position: 'sticky', top: '24px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <Sparkles size={16} style={{ color: 'var(--cyan)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>Aether Intelligence Panel</h3>
            </div>

            {(() => {
              const activeId = showEvidence || (understanding.recommendations.filter(r => r.id !== 'no_prediction')[0]?.id);
              const activeRec = understanding.recommendations.find(r => r.id === activeId);

              if (!activeRec) {
                return (
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                    Select a recommendation to view its evidence details.
                  </div>
                );
              }

              const color = CATEGORY_COLOR[activeRec.category] || 'var(--cyan)';

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Active Recommendation
                    </span>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '4px 0 8px 0', color: 'var(--text-primary)' }}>
                      {activeRec.title}
                    </h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                      {activeRec.description}
                    </p>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', borderLeft: `3px solid ${color}` }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      OBSERVABLE EVIDENCE
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {activeRec.reason}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                      ESTIMATED PIPELINE IMPACT
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color }}>
                        {activeRec.estimatedImpact.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        — {activeRec.action}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </motion.div>

      {/* ─── SCHEMA & METADATA ─────────────────────────────────────────── */}
      <motion.div variants={itemVariants} style={{ marginBottom: '24px' }}>
        <div
          onClick={() => toggleSection('schema')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: expandedSection === 'schema' ? '16px' : '0' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--violet)' }} />
            <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-primary)' }}>SCHEMA & METADATA</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({understanding.columnCount} columns)</span>
          </div>
          {expandedSection === 'schema' ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
        </div>

        <AnimatePresence>
          {expandedSection === 'schema' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Column</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Type</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Semantic</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>Nulls</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>Unique</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Sample Values</th>
                    </tr>
                  </thead>
                  <tbody>
                    {understanding.schema.map(col => {
                      const sem = SEMANTIC_LABELS[col.semanticType] || SEMANTIC_LABELS.unknown;
                      return (
                        <tr key={col.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {col.name}
                            {col.isSensitive && (
                              <span style={{ marginLeft: '8px', fontSize: '10px', background: 'var(--amber)', color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>PII</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '12px' }}>{col.type}</td>
                          <td style={{ padding: '10px 16px' }}>
                            <span style={{ background: `${sem.color}15`, color: sem.color, padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                              {sem.icon} {sem.label}
                            </span>
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: col.nullPercent > 10 ? 'var(--amber)' : 'var(--text-muted)', fontFamily: 'monospace', fontSize: '12px' }}>
                            {col.nullPercent}%
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '12px' }}>
                            {col.uniqueCount.toLocaleString()} ({col.uniquePercent}%)
                          </td>
                          <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {col.sampleValues.slice(0, 3).map(v => {
                              if (col.isSensitive && typeof v === 'string') {
                                if (v.includes('@')) return v[0] + '***@' + v.split('@')[1];
                                return '***';
                              }
                              return String(v);
                            }).join(', ')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Storage metadata & Capability Pushdowns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                <div className="card" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '12px' }}>STORAGE METADATA</div>
                  {[
                    ['File', filename],
                    ['Size', sizeLabel],
                    ['Format', 'Structured Tabular'],
                    ['Ingested', ingestedAt ? new Date(ingestedAt).toLocaleString() : '—'],
                    ['Engine', 'In-Memory Store'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                      <span style={{ fontFamily: 'monospace', color: 'var(--cyan)', fontSize: '12px' }}>{v}</span>
                    </div>
                  ))}
                </div>

                <div className="card" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '12px' }}>INGESTION STRATEGY & CAPABILITIES</div>
                  {(() => {
                    const strategy = determineIngestionStrategy(sourceType, rows.length);
                    const caps = SOURCE_REGISTRY[sourceType];
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Connector Type</span>
                          <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>{caps?.label || sourceType}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Selected Action</span>
                          <span style={{
                            padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                            background: strategy.action === 'extract_full' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                            color: strategy.action === 'extract_full' ? 'var(--emerald)' : 'var(--amber)'
                          }}>
                            {strategy.action.toUpperCase().replace('_', ' ')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Pushdown Capability</span>
                          <span style={{ color: caps?.pushdownSupport ? 'var(--emerald)' : 'var(--text-muted)' }}>
                            {caps?.pushdownSupport ? '✓ Active' : '✗ Unsupported'}
                          </span>
                        </div>
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', color: 'var(--text-muted)', fontSize: '12px', lineHeight: 1.5 }}>
                          <strong>Reasoning:</strong> {strategy.reason}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ─── RELATIONSHIPS ─────────────────────────────────────────────── */}
      {understanding.relationships.length > 0 && (
        <motion.div variants={itemVariants} style={{ marginBottom: '24px' }}>
          <div
            onClick={() => toggleSection('relationships')}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: expandedSection === 'relationships' ? '16px' : '0' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--cyan)' }} />
              <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-primary)' }}>DETECTED RELATIONSHIPS</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({understanding.relationships.length} found)</span>
            </div>
            {expandedSection === 'relationships' ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
          </div>

          <AnimatePresence>
            {expandedSection === 'relationships' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ display: 'grid', gap: '8px' }}>
                  {understanding.relationships.map((rel, i) => (
                    <div key={i} className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--cyan)', fontFamily: 'monospace', fontSize: '13px' }}>{rel.col1}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>↔</span>
                      <span style={{ fontWeight: 700, color: 'var(--cyan)', fontFamily: 'monospace', fontSize: '13px' }}>{rel.col2}</span>
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.abs(rel.strength) * 100}%`, height: '100%', background: rel.strength > 0 ? 'var(--emerald)' : 'var(--rose)', borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '12px', fontFamily: 'monospace', color: rel.strength > 0.7 ? 'var(--emerald)' : rel.strength > 0 ? 'var(--cyan)' : 'var(--rose)', fontWeight: 700 }}>
                          r={rel.strength.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ─── UTILITY ACTIONS ──────────────────────────────────────────── */}
      <motion.div variants={itemVariants} style={{ display: 'flex', gap: '12px', paddingBottom: '40px' }}>
        <button className="btn btn-secondary" onClick={() => exportCSV(headers, rows, filename.replace(/\.[^.]+$/, '_export.csv'))} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
          <Download size={14} /> Export CSV
        </button>
      </motion.div>

    </motion.div>
  );
}
