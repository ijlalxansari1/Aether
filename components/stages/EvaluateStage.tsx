'use client';

import { ColumnType, DataRow } from '@/lib/types';
import { motion } from 'framer-motion';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

interface EvaluateStageProps {
  headers: string[];
  types: Record<string, ColumnType>;
  rows: DataRow[];
  onProceed: () => void;
}

export default function EvaluateStage({ headers, types, rows, onProceed }: EvaluateStageProps) {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="stage-content">
      <motion.div variants={itemVariants} className="stage-header flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="stage-title" style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            <span style={{ marginRight: '12px' }}>🎯</span> Model Evaluation
          </h1>
          <p className="stage-sub" style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '16px' }}>Review the performance metrics of your trained model.</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={onProceed} 
          style={{ 
            background: 'linear-gradient(135deg, var(--violet, #7c3aed), var(--accent, #6366f1))', 
            border: 'none', 
            color: '#fff', 
            boxShadow: '0 0 20px rgba(139,92,246,0.4)',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Deploy Model →
        </button>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <motion.div variants={itemVariants} className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '8px' }}>ACCURACY</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--emerald)' }}>94.2%</div>
        </motion.div>
        <motion.div variants={itemVariants} className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '8px' }}>PRECISION</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--cyan)' }}>91.8%</div>
        </motion.div>
        <motion.div variants={itemVariants} className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '8px' }}>RECALL</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--violet)' }}>89.5%</div>
        </motion.div>
        <motion.div variants={itemVariants} className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '8px' }}>F1 SCORE</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent)' }}>0.906</div>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <motion.div variants={itemVariants} className="card" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          [ ROC Curve Visualization ]
        </motion.div>
        <motion.div variants={itemVariants} className="card" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          [ Confusion Matrix ]
        </motion.div>
      </div>
    </motion.div>
  );
}
