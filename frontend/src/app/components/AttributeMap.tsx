import React from 'react';
import { Database, ShieldCheck } from 'lucide-react';
import { EDAColumn } from '../../types/analysis';

export default function AttributeMap({ columns }: { columns: EDAColumn[] }) {
  return (
    <div className="glass-card rounded-[3rem] overflow-hidden border-none shadow-[0_32px_80px_rgba(0,0,0,0.4)]">
      <div className="p-10 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
        <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-[rgb(var(--accent))]/5 border border-[rgb(var(--accent))]/10 flex items-center justify-center text-[rgb(var(--accent))]">
                <Database className="w-6 h-6" />
            </div>
            <div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">Metadata Repository</h4>
                <p className="text-2xl font-black text-white uppercase tracking-tighter">Attribute Intelligence Map</p>
            </div>
        </div>
        <div className="hidden md:flex items-center gap-3 px-6 py-2 rounded-2xl bg-white/[0.03] border border-white/5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{columns.length} Nodes Synchronized</span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.02]">
              <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Attribute Node</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Syntactic Type</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Completeness</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Aether Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {columns.map((col, i) => (
              <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-10 py-7">
                  <span className="text-sm font-black text-white uppercase tracking-tight group-hover:text-[rgb(var(--accent))] transition-colors">{col.name}</span>
                </td>
                <td className="px-10 py-7">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-1 rounded-lg bg-white/5 border border-white/5">{col.type}</span>
                </td>
                <td className="px-10 py-7">
                  <div className="w-full max-w-[120px] h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[rgb(var(--accent))] transition-all duration-1000" 
                      style={{ width: `${100 - col.missing_percent}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 mt-2 block uppercase">{(100 - col.missing_percent).toFixed(1)}% Signal</span>
                </td>
                <td className="px-10 py-7 text-right">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl ${
                    col.notes.toLowerCase() === 'ok' || col.notes.toLowerCase().includes('low') 
                      ? 'text-emerald-400 bg-emerald-500/5 border border-emerald-500/10' 
                      : 'text-rose-400 bg-rose-500/5 border border-rose-500/10'
                  }`}>
                    {col.notes}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
