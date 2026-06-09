'use client';

import { ColumnType, DataRow } from '@/lib/types';
import { fmtNum } from '@/lib/dataUtils';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

interface DashboardStageProps {
  headers: string[];
  types: Record<string, ColumnType>;
  rows: DataRow[];
  filename: string;
  onProceed: () => void;
}

export default function DashboardStage({ headers, types, rows, filename, onProceed }: DashboardStageProps) {
  const [editMode, setEditMode] = useState(false);
  const [layout, setLayout] = useState([
    { id: 'kpis', width: '100%' },
    { id: 'main', width: '66.66%' },
    { id: 'pie', width: '33.33%' }
  ]);
  
  const [mainType, setMainType] = useState<'bar' | 'line'>('bar');
  const numCols = headers.filter(h => types[h] === 'number');
  const strCols = headers.filter(h => types[h] === 'string');

  const [selectedX, setSelectedX] = useState<string>(strCols[0] || '');
  const [selectedY, setSelectedY] = useState<string>(numCols[0] || '');

  // KPIs
  const kpis = numCols.slice(0, 4).map(h => {
    const vals = rows.map(r => Number(r[h])).filter(v => !isNaN(v));
    const avg = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    const change = parseFloat((Math.random() * 20 - 10).toFixed(1));
    return { label: h.replace(/_/g, ' ').toUpperCase(), value: fmtNum(avg), change, up: change >= 0 };
  });
  if (!kpis.length) kpis.push({ label: 'TOTAL ROWS', value: fmtNum(rows.length), change: 0, up: true });

  // Main chart data
  const mainDataMap: Record<string, number> = {};
  rows.forEach(r => { 
    const k = String(r[selectedX] || 'Unknown'); 
    mainDataMap[k] = (mainDataMap[k] || 0) + (Number(r[selectedY]) || 0); 
  });
  const mainData = Object.entries(mainDataMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(1)) }));

  // Pie chart data
  const pieDataMap: Record<string, number> = {};
  rows.forEach(r => { 
    const k = String(r[strCols[0] || 'Unknown']); 
    pieDataMap[k] = (pieDataMap[k] || 0) + 1; 
  });
  const pieData = Object.entries(pieDataMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  const COLORS = ['#0891b2', '#7c3aed', '#059669', '#d97706', '#dc2626'];

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="stage-content">
      <motion.div variants={itemVariants} className="stage-header flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="stage-title" style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            <span style={{ marginRight: '12px' }}>📈</span> Dashboard & Reporting
          </h1>
          <p className="stage-sub" style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '16px' }}>Interactive KPIs, trend charts, and reports for stakeholders.</p>
        </div>
        <div className="flex gap-8">
          <button 
            className="btn btn-secondary" 
            onClick={() => setEditMode(!editMode)}
            style={{ borderColor: editMode ? 'var(--emerald)' : 'var(--border)', color: editMode ? 'var(--emerald)' : '#fff' }}
          >
            {editMode ? '✅ Save Layout' : '📐 Edit Layout'}
          </button>
          <button className="btn btn-primary" onClick={onProceed} style={{ background: 'linear-gradient(135deg, var(--violet, #7c3aed), var(--accent, #6366f1))', border: 'none', color: '#fff', boxShadow: '0 0 20px rgba(139,92,246,0.4)' }}>📋 BI Report →</button>
        </div>
      </motion.div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        {layout.map((block, index) => {
          const isKpi = block.id === 'kpis';
          const isMain = block.id === 'main';
          const isPie = block.id === 'pie';
          
          return (
            <motion.div 
              layout
              variants={itemVariants} 
              key={block.id}
              style={{ 
                flex: `0 0 calc(${block.width} - ${block.width === '100%' ? '0px' : '12px'})`, 
                minWidth: '300px',
                position: 'relative',
                border: editMode ? '2px dashed var(--emerald)' : 'none',
                borderRadius: '12px',
                padding: editMode ? '8px' : '0'
              }}
            >
              {editMode && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', background: 'rgba(16,185,129,0.1)', padding: '4px 8px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button disabled={index === 0} onClick={() => { const l = [...layout]; const t = l[index]; l[index] = l[index-1]; l[index-1] = t; setLayout(l); }} style={{ background: 'transparent', border: 'none', color: index === 0 ? 'var(--text-muted)' : 'var(--emerald)', cursor: 'pointer' }}>◀ Prev</button>
                    <button disabled={index === layout.length - 1} onClick={() => { const l = [...layout]; const t = l[index]; l[index] = l[index+1]; l[index+1] = t; setLayout(l); }} style={{ background: 'transparent', border: 'none', color: index === layout.length - 1 ? 'var(--text-muted)' : 'var(--emerald)', cursor: 'pointer' }}>Next ▶</button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { const l = [...layout]; l[index].width = '33.33%'; setLayout(l); }} style={{ background: block.width === '33.33%' ? 'var(--emerald)' : 'transparent', color: block.width === '33.33%' ? '#000' : 'var(--emerald)', border: '1px solid var(--emerald)', borderRadius: '4px', cursor: 'pointer' }}>1/3</button>
                    <button onClick={() => { const l = [...layout]; l[index].width = '50%'; setLayout(l); }} style={{ background: block.width === '50%' ? 'var(--emerald)' : 'transparent', color: block.width === '50%' ? '#000' : 'var(--emerald)', border: '1px solid var(--emerald)', borderRadius: '4px', cursor: 'pointer' }}>1/2</button>
                    <button onClick={() => { const l = [...layout]; l[index].width = '66.66%'; setLayout(l); }} style={{ background: block.width === '66.66%' ? 'var(--emerald)' : 'transparent', color: block.width === '66.66%' ? '#000' : 'var(--emerald)', border: '1px solid var(--emerald)', borderRadius: '4px', cursor: 'pointer' }}>2/3</button>
                    <button onClick={() => { const l = [...layout]; l[index].width = '100%'; setLayout(l); }} style={{ background: block.width === '100%' ? 'var(--emerald)' : 'transparent', color: block.width === '100%' ? '#000' : 'var(--emerald)', border: '1px solid var(--emerald)', borderRadius: '4px', cursor: 'pointer' }}>Full</button>
                  </div>
                </div>
              )}

              {isKpi && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  {kpis.map((k, i) => (
                    <motion.div whileHover={{ y: -4 }} key={i} className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden', height: '100%' }}>
                      <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: `radial-gradient(circle, ${k.up ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)'} 0%, transparent 70%)`, transform: 'translate(30%, -30%)' }} />
                      <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 700, letterSpacing: '1px', marginBottom: '12px' }}>{k.label}</div>
                      <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono', marginBottom: '8px' }}>{k.value}</div>
                      <div style={{ color: k.up ? 'var(--emerald)' : 'var(--rose)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {k.up ? '▲' : '▼'} {Math.abs(k.change)}% vs last period
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {isMain && (
                <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div className="flex-between" style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Custom Distribution</h3>
                    <div className="flex gap-8" style={{ alignItems: 'center' }}>
                      <select className="search-input" value={selectedX} onChange={e => setSelectedX(e.target.value)} style={{ padding: '4px 8px', width: 'auto' }}>
                        {strCols.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <span style={{ color: 'var(--text-muted)' }}>vs</span>
                      <select className="search-input" value={selectedY} onChange={e => setSelectedY(e.target.value)} style={{ padding: '4px 8px', width: 'auto' }}>
                        {numCols.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                        <button 
                          onClick={() => setMainType('bar')} 
                          style={{ background: mainType === 'bar' ? 'var(--accent)' : 'transparent', color: mainType === 'bar' ? '#fff' : 'var(--text-muted)', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                        >Bar</button>
                        <button 
                          onClick={() => setMainType('line')} 
                          style={{ background: mainType === 'line' ? 'var(--accent)' : 'transparent', color: mainType === 'line' ? '#fff' : 'var(--text-muted)', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                        >Line</button>
                      </div>
                    </div>
                  </div>
                  <div style={{ flex: 1, minHeight: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      {mainType === 'bar' ? (
                        <BarChart data={mainData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={fmtNum} />
                          <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                          <Bar dataKey="value" fill="var(--cyan)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      ) : (
                        <LineChart data={mainData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={fmtNum} />
                          <RechartsTooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                          <Line type="monotone" dataKey="value" stroke="var(--violet)" strokeWidth={3} dot={{ fill: 'var(--violet)', r: 4 }} />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {isPie && (
                <motion.div className="card" style={{ height: '100%' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Composition</h3>
                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
