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

  // Filters
  const [globalFilterCol, setGlobalFilterCol] = useState<string>('');
  const [globalFilterVal, setGlobalFilterVal] = useState<string>('');

  const filteredRows = rows.filter(r => {
    if (!globalFilterCol || !globalFilterVal) return true;
    return String(r[globalFilterCol]) === globalFilterVal;
  });

  const [selectedX, setSelectedX] = useState<string>(strCols[0] || '');
  const [selectedY, setSelectedY] = useState<string>(numCols[0] || '');

  // Dynamic KPI configs
  const [kpiConfigs, setKpiConfigs] = useState<{ col: string, agg: 'sum'|'avg'|'count' }[]>(() => {
    return [
      { col: numCols[0] || '', agg: 'sum' as const },
      { col: numCols[1] || numCols[0] || '', agg: 'avg' as const },
      { col: numCols[2] || numCols[0] || '', agg: 'avg' as const },
      { col: numCols[3] || numCols[0] || '', agg: 'sum' as const }
    ].filter(c => c.col !== '');
  });

  const kpis = kpiConfigs.map((conf, idx) => {
    const vals = filteredRows.map(r => Number(r[conf.col])).filter(v => !isNaN(v));
    let val = 0;
    if (conf.agg === 'sum') val = vals.reduce((a, b) => a + b, 0);
    else if (conf.agg === 'avg') val = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    else if (conf.agg === 'count') val = vals.length;
    return { id: idx, col: conf.col, agg: conf.agg, label: `${conf.agg.toUpperCase()} of ${conf.col.replace(/_/g, ' ')}`, value: fmtNum(val) };
  });
  if (!kpis.length) kpis.push({ id: 0, col: '', agg: 'count', label: 'TOTAL ROWS', value: fmtNum(filteredRows.length) });

  // Main chart data
  const mainDataMap: Record<string, number> = {};
  filteredRows.forEach(r => { 
    const k = String(r[selectedX] || 'Unknown'); 
    mainDataMap[k] = (mainDataMap[k] || 0) + (Number(r[selectedY]) || 0); 
  });
  const mainData = Object.entries(mainDataMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(1)) }));

  // Pie chart config
  const [pieCol, setPieCol] = useState<string>(strCols[0] || '');
  const pieDataMap: Record<string, number> = {};
  filteredRows.forEach(r => { 
    const k = String(r[pieCol || 'Unknown']); 
    pieDataMap[k] = (pieDataMap[k] || 0) + 1; 
  });
  const pieData = Object.entries(pieDataMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  const exportCSV = () => {
    if (!filteredRows.length) return;
    const cols = Object.keys(filteredRows[0]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + cols.join(",") + "\n"
      + filteredRows.map(e => cols.map(c => e[c]).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename || 'export'}_filtered.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          <button className="btn btn-secondary" onClick={exportCSV} style={{ background: 'transparent', border: '1px solid var(--border)' }}>
            ⬇️ Export CSV
          </button>
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

      {/* Global Filter Toolbar */}
      <div style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>🔍 Global Filters</span>
        <select className="input" value={globalFilterCol} onChange={e => { setGlobalFilterCol(e.target.value); setGlobalFilterVal(''); }} style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-body)' }}>
          <option value="">-- Select Filter Column --</option>
          {strCols.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {globalFilterCol && (
          <select className="input" value={globalFilterVal} onChange={e => setGlobalFilterVal(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-body)' }}>
            <option value="">-- Select Value --</option>
            {Array.from(new Set(rows.map(r => String(r[globalFilterCol])))).sort().map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-muted)' }}>
          Showing {filteredRows.length.toLocaleString()} rows
        </span>
      </div>

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
                      <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: `radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)`, transform: 'translate(30%, -30%)' }} />
                      
                      {editMode ? (
                        <div style={{ marginBottom: '12px', zIndex: 10, position: 'relative' }}>
                          <select value={kpiConfigs[i]?.agg || 'sum'} onChange={e => { const newC = [...kpiConfigs]; if(newC[i]) newC[i].agg = e.target.value as any; setKpiConfigs(newC); }} style={{ fontSize: '11px', padding: '2px', marginRight: '4px', background: 'var(--bg-body)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '4px' }}>
                            <option value="sum">SUM</option>
                            <option value="avg">AVG</option>
                            <option value="count">COUNT</option>
                          </select>
                          <select value={kpiConfigs[i]?.col || ''} onChange={e => { const newC = [...kpiConfigs]; if(newC[i]) newC[i].col = e.target.value; setKpiConfigs(newC); }} style={{ fontSize: '11px', padding: '2px', background: 'var(--bg-body)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '4px' }}>
                            {numCols.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 700, letterSpacing: '1px', marginBottom: '12px' }}>{k.label}</div>
                      )}

                      <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono', marginBottom: '8px' }}>{k.value}</div>
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
                  <div className="flex-between" style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Composition</h3>
                    <select className="search-input" value={pieCol} onChange={e => setPieCol(e.target.value)} style={{ padding: '4px 8px', width: 'auto' }}>
                      {strCols.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
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
