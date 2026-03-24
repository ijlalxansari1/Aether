"use client";

import { useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid
} from "recharts";
import { BarChart3, TrendingUp, Layers, Hash } from "lucide-react";

export default function VisualAnalysis({ eda }: { eda: any }) {
  const [selectedCol, setSelectedCol] = useState(eda?.columns?.[0]?.name || "");

  if (!eda || !eda.columns) return null;

  const currentColumn = eda.columns.find((c: any) => c.name === selectedCol) || eda.columns[0];
  const isNumeric = currentColumn.type === "numeric" || currentColumn.type === "continuous";
  const isCategorical = currentColumn.type === "categorical";
  const hasChartData = currentColumn.chart_data && currentColumn.chart_data.length > 0;

  return (
    <div className="glass-card p-10 rounded-[3rem] border border-white/5 space-y-8 animate-in fade-in duration-1000 slide-in-from-bottom-10 delay-300">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Visual Intelligence</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Auto-generated spatial distributions</p>
          </div>
        </div>

        {/* Column Selector */}
        <div className="relative w-full md:w-64">
          <select 
            value={selectedCol} 
            onChange={(e) => setSelectedCol(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-[11px] font-black text-white uppercase tracking-wider appearance-none focus:outline-none focus:border-indigo-500/50"
          >
            {eda.columns.map((c: any) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        {/* Chart Frame */}
        <div className="md:col-span-8 h-[350px] bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 relative flex flex-col items-center justify-center">
          {!hasChartData ? (
            <div className="text-center opacity-50">
              <Layers className="w-10 h-10 mx-auto mb-4 text-slate-500" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Visualization not supported for this axis</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {isNumeric ? (
                <BarChart data={currentColumn.chart_data}>
                  <XAxis dataKey="bin" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: "rgba(255,255,255,0.02)" }}
                    contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "1rem", fontSize: "11px", fontWeight: "bold" }}
                  />
                  <Bar dataKey="count" fill="url(#colorUv)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              ) : (
                <BarChart data={currentColumn.chart_data} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: "rgba(255,255,255,0.02)" }}
                    contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "1rem", fontSize: "11px", fontWeight: "bold" }}
                  />
                  <Bar dataKey="count" fill="#34d399" radius={[0, 4, 4, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* Insight Summary Pane */}
        <div className="md:col-span-4 bg-indigo-500/5 border border-indigo-500/10 rounded-[2rem] p-6 space-y-6 flex flex-col justify-center">
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">Morphology Scan</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-500/10 pb-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Type</span>
                <span className="text-[11px] font-black text-white uppercase tracking-wider">{currentColumn.type}</span>
              </div>
              {currentColumn.distribution && (
                <div className="flex items-center justify-between border-b border-indigo-500/10 pb-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Shape</span>
                    <span className="text-[11px] font-black text-white uppercase tracking-wider">{currentColumn.distribution}</span>
                </div>
              )}
              {currentColumn._stats?.mean !== undefined && (
                <div className="flex items-center justify-between border-b border-indigo-500/10 pb-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mean Val</span>
                    <span className="text-[11px] font-black text-white uppercase tracking-wider">{currentColumn._stats.mean}</span>
                </div>
              )}
              {currentColumn.unique_count !== undefined && (
                <div className="flex items-center justify-between border-b border-indigo-500/10 pb-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Unique Range</span>
                    <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">{currentColumn.unique_count} Values</span>
                </div>
              )}
              <div className="flex items-center gap-3 pt-2">
                <Hash className="w-4 h-4 text-slate-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                  {currentColumn.notes || (isNumeric ? "Continuous distribution suitable for density scaling." : "Categorical boundaries analyzed.")}
                </span>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
