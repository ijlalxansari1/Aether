import React from 'react';
import { ShieldAlert, CheckCircle, ChevronRight } from 'lucide-react';
import { EthicalResult } from '../../types/analysis';

export default function EthicalPanel({ ethical }: { ethical: EthicalResult }) {
  const isHighRisk = ethical.risk_level === "High";
  
  return (
    <div className="glass-card rounded-[3rem] p-10 relative overflow-hidden h-full flex flex-col border-none shadow-[0_24px_64px_rgba(0,0,0,0.3)]">
      <div className="flex items-center gap-4 mb-10">
        <div className={`w-12 h-12 rounded-[1.5rem] flex items-center justify-center border ${isHighRisk ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Security & Ethics</h4>
          <p className="text-2xl font-black text-white uppercase tracking-tighter">{ethical.risk_level} Risk Gradient</p>
        </div>
      </div>

      <div className="flex-1 space-y-10">
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
            <p className="text-xs font-black text-slate-400 leading-relaxed uppercase tracking-wider italic">
              &quot;{ethical.message}&quot;
            </p>
        </div>

        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Compromised Vectors</h5>
                <span className="bg-white/5 px-3 py-1 rounded-lg text-[8px] font-black text-slate-300 uppercase">{ethical.columns.length} Nodes</span>
            </div>
            <div className="flex flex-wrap gap-2">
            {ethical.columns.map(col => (
                <span key={col} className="bg-rose-500/5 px-4 py-2 rounded-xl text-[10px] font-black text-rose-400 border border-rose-500/10 hover:bg-rose-500/10 transition-colors uppercase tracking-tight">
                {col}
                </span>
            ))}
            </div>
        </div>

        {/* Recommended Actions */}
        {ethical.recommendations && (
            <div className="space-y-6 pt-10 border-t border-white/5">
                <h5 className="text-[9px] font-black text-[rgb(var(--accent))] uppercase tracking-widest">Recommended Mitigation</h5>
                <div className="space-y-2">
                    {ethical.recommendations.map((action, i) => (
                        <div key={i} className="flex items-center gap-3 group">
                            <ChevronRight className="w-3 h-3 text-[rgb(var(--accent))] group-hover:translate-x-1 transition-transform" />
                            <span className="text-[10px] font-black text-slate-200 uppercase tracking-tight">{action}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      <div className="mt-12 flex items-center gap-3">
        <CheckCircle className="w-4 h-4 text-emerald-500/40" />
        <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em]">Zero-Persistence Scan Complete</span>
      </div>
    </div>
  );
}
