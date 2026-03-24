import React from 'react';
import { AlertTriangle, CheckCircle, Wand2 } from 'lucide-react';
import { QualityResult } from '../../types/analysis';

export default function QualityDashboard({ quality }: { quality: QualityResult }) {
  return (
    <div className="glass-card rounded-[3rem] p-10 relative overflow-hidden group border-none shadow-[0_24px_64px_rgba(0,0,0,0.3)] h-full">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[rgb(var(--accent))]/5 rounded-full blur-[100px] -mr-32 -mt-32" />
      
      <div className="relative">
        {/* Title */}
        <div className="mb-10">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Health & Integrity</h4>
            <div className="flex items-center gap-4">
              <p className="text-2xl font-black text-white uppercase tracking-tighter">Quality Dashboard</p>
              <span className="bg-[rgb(var(--accent))]/10 text-[rgb(var(--accent))] text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-[rgb(var(--accent))]/20">
                  Grade {quality.grade}
              </span>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left: Issues and Metrics */}
            <div className="space-y-10">
                {quality.metrics && (
                    <div className="grid grid-cols-2 gap-4 pb-10 border-b border-white/5">
                        {[
                            { label: "Completeness", val: `${quality.metrics.completeness}%` },
                            { label: "Duplicates", val: `${quality.metrics.duplicates}%` },
                            { label: "Balance", val: quality.metrics.is_balanced ? 'Balanced' : 'Skewed' },
                            { label: "Privacy Risk", val: quality.metrics.privacy_risk }
                        ].map((m, i) => (
                            <div key={i} className="text-left bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{m.label}</p>
                                <p className="text-sm font-black text-slate-100 uppercase tracking-tight">{m.val}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> System Flags
                    </h4>
                    <div className="space-y-3">
                        {quality.issues.map((issue, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-rose-500/[0.03] border border-rose-500/10">
                            <div className="w-2 h-2 rounded-full bg-rose-500/40 shrink-0" />
                            <span className="text-xs font-black text-slate-300 uppercase tracking-tight leading-tight">{issue}</span>
                        </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Recommendations */}
            <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Wand2 className="w-3.5 h-3.5 text-[rgb(var(--accent))]" /> Action Items
                </h4>
                <div className="space-y-3">
                    {quality.recommendations.map((rec, i) => (
                    <div key={i} className="group cursor-default flex items-center gap-4 p-4 rounded-2xl bg-[rgb(var(--accent))]/[0.03] border border-[rgb(var(--accent))]/10 hover:border-[rgb(var(--accent))]/30 transition-all duration-300">
                        <div className="w-8 h-8 shrink-0 rounded-xl bg-[rgb(var(--accent))]/10 border border-[rgb(var(--accent))]/20 flex items-center justify-center text-[rgb(var(--accent))] group-hover:bg-[rgb(var(--accent))] group-hover:text-white transition-all">
                        <CheckCircle className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black text-slate-200 uppercase tracking-tight leading-tight">{rec}</span>
                    </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
