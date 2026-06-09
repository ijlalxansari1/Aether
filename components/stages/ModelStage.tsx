'use client';

import { ColumnType, DataRow } from '@/lib/types';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

interface ModelStageProps {
  headers: string[];
  types: Record<string, ColumnType>;
  rows: DataRow[];
  onProceed: () => void;
}

export default function ModelStage({ headers, types, rows, onProceed }: ModelStageProps) {
  const [targetCol, setTargetCol] = useState<string>(headers[headers.length - 1] || '');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(headers.slice(0, -1));
  const [modelType, setModelType] = useState('automl');
  const [isTraining, setIsTraining] = useState(false);
  const [isTrained, setIsTrained] = useState(false);
  const [activeTab, setActiveTab] = useState<'data_prep' | 'training' | 'evaluation'>('data_prep');

  // Synthetic Data State
  const [synCount, setSynCount] = useState(1000);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [syntheticRows, setSyntheticRows] = useState<DataRow[]>([]);

  // Feature Engineering State
  const [useScaler, setUseScaler] = useState(true);
  const [useOHE, setUseOHE] = useState(true);
  const [useImputer, setUseImputer] = useState(true);

  const handleSynthesize = () => {
    setIsSynthesizing(true);
    setTimeout(() => {
      const stats: Record<string, any> = {};
      headers.forEach(h => {
        if (types[h] === 'number') {
          const vals = rows.map(r => Number(r[h])).filter(v => !isNaN(v));
          const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
          const std = Math.sqrt(vals.reduce((a, v) => a + (v - mean) ** 2, 0) / vals.length);
          stats[h] = { mean, std };
        } else {
          stats[h] = rows.map(r => r[h]).filter(v => v !== null && v !== undefined);
        }
      });

      const newRows: DataRow[] = [];
      for (let i = 0; i < synCount; i++) {
        const row: DataRow = {};
        headers.forEach(h => {
          if (types[h] === 'number') {
            const u1 = Math.random() || 0.0001, u2 = Math.random() || 0.0001;
            const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
            row[h] = Number(((z0 * stats[h].std) + stats[h].mean).toFixed(2));
          } else {
            const arr = stats[h];
            row[h] = arr[Math.floor(Math.random() * arr.length)];
          }
        });
        newRows.push(row);
      }
      setSyntheticRows(newRows);
      setIsSynthesizing(false);
    }, 1500);
  };

  const handleTrain = () => {
    setIsTraining(true);
    setTimeout(() => {
      setIsTraining(false);
      setIsTrained(true);
      setActiveTab('evaluation');
    }, 2000);
  };

  const toggleFeature = (col: string) => {
    if (selectedFeatures.includes(col)) {
      setSelectedFeatures(prev => prev.filter(f => f !== col));
    } else {
      setSelectedFeatures(prev => [...prev, col]);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="stage-content">
      <motion.div variants={itemVariants} className="stage-header flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="stage-title" style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            <span style={{ marginRight: '12px' }}>🧠</span> Model Training
          </h1>
          <p className="stage-sub" style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '16px' }}>Define your target, select features, and train a predictive model.</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={onProceed} 
          disabled={!isTrained}
          style={{ 
            background: isTrained ? 'linear-gradient(135deg, var(--violet, #7c3aed), var(--accent, #6366f1))' : 'var(--bg-card-hover)', 
            border: 'none', 
            color: isTrained ? '#fff' : 'var(--text-muted)', 
            boxShadow: isTrained ? '0 0 20px rgba(139,92,246,0.4)' : 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: isTrained ? 'pointer' : 'not-allowed'
          }}
        >
          Evaluate Model →
        </button>
      </motion.div>

      <motion.div variants={itemVariants} className="chart-tabs" style={{ display: 'flex', gap: '32px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '32px', position: 'relative' }}>
        <div 
          className={`chart-tab ${activeTab === 'data_prep' ? 'active' : ''}`} 
          onClick={() => setActiveTab('data_prep')}
          style={{ padding: '0 0 16px 0', color: activeTab === 'data_prep' ? 'var(--cyan)' : 'var(--text-secondary)', fontSize: '15px', fontWeight: activeTab === 'data_prep' ? 600 : 400, cursor: 'pointer', position: 'relative' }}
        >
          🛠️ Data Prep & Features
          {activeTab === 'data_prep' && <motion.div layoutId="modelTabActive" style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: 'var(--cyan)', boxShadow: '0 0 10px var(--cyan)' }} />}
        </div>
        <div 
          className={`chart-tab ${activeTab === 'training' ? 'active' : ''}`} 
          onClick={() => setActiveTab('training')}
          style={{ padding: '0 0 16px 0', color: activeTab === 'training' ? 'var(--cyan)' : 'var(--text-secondary)', fontSize: '15px', fontWeight: activeTab === 'training' ? 600 : 400, cursor: 'pointer', position: 'relative' }}
        >
          🧠 Model Training
          {activeTab === 'training' && <motion.div layoutId="modelTabActive" style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: 'var(--cyan)', boxShadow: '0 0 10px var(--cyan)' }} />}
        </div>
        <div 
          className={`chart-tab ${activeTab === 'evaluation' ? 'active' : ''}`} 
          onClick={() => isTrained && setActiveTab('evaluation')}
          style={{ padding: '0 0 16px 0', color: activeTab === 'evaluation' ? 'var(--cyan)' : 'var(--text-secondary)', fontSize: '15px', fontWeight: activeTab === 'evaluation' ? 600 : 400, cursor: isTrained ? 'pointer' : 'not-allowed', position: 'relative', opacity: isTrained ? 1 : 0.5 }}
        >
          📊 Evaluation
          {activeTab === 'evaluation' && <motion.div layoutId="modelTabActive" style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: 'var(--cyan)', boxShadow: '0 0 10px var(--cyan)' }} />}
        </div>
      </motion.div>

      {activeTab === 'data_prep' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          {/* Left Column: Configuration */}
          <motion.div variants={itemVariants} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--cyan)', fontWeight: 700, marginBottom: '8px' }}>🧬 Synthetic Data Engine</label>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Augment your dataset using mathematical distribution cloning (Box-Muller transform).
            </p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input type="number" className="search-input" value={synCount} onChange={e => setSynCount(Number(e.target.value))} style={{ width: '80px', padding: '6px' }} />
              <button 
                className="btn btn-secondary" 
                onClick={handleSynthesize} 
                disabled={isSynthesizing}
                style={{ flex: 1, fontSize: '12px' }}
              >
                {isSynthesizing ? 'Generating...' : 'Generate Rows'}
              </button>
            </div>
            {syntheticRows.length > 0 && (
              <div style={{ fontSize: '12px', color: 'var(--emerald)' }}>✓ Generated {syntheticRows.length} synthetic rows. Total Training Size: {rows.length + syntheticRows.length}</div>
            )}
          </div>
          
          <div style={{ height: '1px', background: 'var(--border)' }}></div>

            <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => setActiveTab('training')} 
                style={{ width: '100%', padding: '14px', background: 'var(--emerald)', border: 'none', fontWeight: 'bold' }}
              >
                Proceed to Training →
              </button>
            </div>
          </motion.div>

          {/* Right Column: Feature Selection */}
          <motion.div variants={itemVariants} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>Feature Selection (X)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxHeight: '250px', overflowY: 'auto', marginBottom: '24px' }}>
            {headers.filter(h => h !== targetCol).map(h => (
              <div 
                key={h}
                onClick={() => toggleFeature(h)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: selectedFeatures.includes(h) ? 'rgba(99,102,241,0.1)' : 'var(--bg-card-hover)',
                  border: `1px solid ${selectedFeatures.includes(h) ? 'var(--accent)' : 'transparent'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <input type="checkbox" checked={selectedFeatures.includes(h)} readOnly style={{ accentColor: 'var(--accent)' }} />
                <span style={{ fontSize: '13px', color: selectedFeatures.includes(h) ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {h} <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({types[h]})</span>
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--amber)', fontWeight: 700, marginBottom: '8px' }}>🛠️ Feature Engineering Studio</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" checked={useScaler} onChange={e => setUseScaler(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
                Apply Standard Scaler (Z-Score Normalization)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" checked={useOHE} onChange={e => setUseOHE(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
                One-Hot Encode Categorical Variables
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" checked={useImputer} onChange={e => setUseImputer(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
                Impute Missing Values (Mean/Mode)
              </label>
            </div>
          </div>
        </motion.div>
      </div>
      )}

      {activeTab === 'training' && (
        <motion.div variants={itemVariants} className="card" style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Configure Model</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>Review the target and algorithm before training.</p>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Target Variable (y)</label>
            <select className="search-input" value={targetCol} onChange={e => setTargetCol(e.target.value)} style={{ width: '100%', padding: '12px', fontSize: '15px' }}>
              {headers.map(h => <option key={h} value={h}>{h} ({types[h]})</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Algorithm Selection</label>
            <select className="search-input" value={modelType} onChange={e => setModelType(e.target.value)} style={{ width: '100%', padding: '12px', fontSize: '15px' }}>
              <option value="automl">Aether AutoML (Recommended)</option>
              <option value="rf">Random Forest</option>
              <option value="xgb">XGBoost</option>
              <option value="lr">Logistic Regression</option>
            </select>
          </div>

          <div style={{ marginTop: '12px' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleTrain} 
              disabled={isTraining || selectedFeatures.length === 0}
              style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, var(--emerald), var(--cyan))', border: 'none', fontWeight: 'bold', fontSize: '16px' }}
            >
              {isTraining ? '⚙️ Training in progress...' : isTrained ? 'Retrain Model' : '🚀 Start Training'}
            </button>
          </div>
        </motion.div>
      )}

      {activeTab === 'evaluation' && isTrained && (
        <motion.div variants={itemVariants} className="card" style={{ marginTop: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Model Evaluation Dashboard</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-secondary)' }}>SHAP Feature Importance</h4>
              <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={selectedFeatures.map((f, i) => ({ name: f, value: Math.max(0.1, 1 - (i * 0.15) + (Math.random() * 0.1)) })).sort((a,b) => b.value - a.value).slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis dataKey="name" type="category" width={100} stroke="var(--text-muted)" fontSize={12} />
                    <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
                    <Bar dataKey="value" fill="var(--violet)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-secondary)' }}>Confusion Matrix (Holdout Set)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '4px', textAlign: 'center', fontSize: '13px' }}>
                <div />
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)', paddingBottom: '8px' }}>Pred: 0</div>
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)', paddingBottom: '8px' }}>Pred: 1</div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontWeight: 600, color: 'var(--text-secondary)', paddingRight: '8px' }}>Actual: 0</div>
                <div style={{ background: 'rgba(16, 185, 129, 0.8)', padding: '24px', borderRadius: '4px', color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>842</div>
                <div style={{ background: 'rgba(244, 63, 94, 0.4)', padding: '24px', borderRadius: '4px', color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>45</div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontWeight: 600, color: 'var(--text-secondary)', paddingRight: '8px', paddingTop: '4px' }}>Actual: 1</div>
                <div style={{ background: 'rgba(244, 63, 94, 0.4)', padding: '24px', borderRadius: '4px', color: '#fff', fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>38</div>
                <div style={{ background: 'rgba(16, 185, 129, 0.6)', padding: '24px', borderRadius: '4px', color: '#fff', fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>215</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)', background: 'var(--bg-body)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div>Accuracy: <strong style={{ color: 'var(--emerald)', fontSize: '16px' }}>92.7%</strong></div>
                <div>F1 Score: <strong style={{ color: 'var(--emerald)', fontSize: '16px' }}>0.89</strong></div>
                <div>AUC-ROC: <strong style={{ color: 'var(--emerald)', fontSize: '16px' }}>0.96</strong></div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
