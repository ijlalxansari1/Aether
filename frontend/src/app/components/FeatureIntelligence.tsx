import React from 'react';
import { Layers, Zap, AlertCircle, Ban } from 'lucide-react';

import { FeatureResult } from '../../types/analysis';

export default function FeatureIntelligence({ features: data }: { features: FeatureResult }) {
  return (
    <div className="glass-card rounded-[3rem] p-10 relative overflow-hidden flex flex-col h-full border-none">
        <div className="flex items-center gap-4 mb-12">
            <div className="w-10 h-10 rounded-2xl bg-[rgb(var(--accent))]/10 border border-[rgb(var(--accent))]/20 flex items-center justify-center text-[rgb(var(--accent))]">
                <Layers className="w-5 h-5" />
            </div>
            <div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Feature Metadata</h4>
                <p className="text-2xl font-black text-white uppercase tracking-tighter">Vector Intelligence</p>
            </div>
        </div>

        <div className="space-y-12">
            {/* 1. High Value Features */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">High Signal Nodes</span>
                    </div>
                    <span className="text-[9px] font-black text-amber-400/40 uppercase tracking-widest">{data.important_features.length} detected</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    {data.important_features.map(f => (
                        <div key={f.name} className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/[0.03] border border-amber-500/10">
                            <span className="text-[11px] font-black text-slate-100 uppercase tracking-tight">{f.name}</span>
                            <span className="text-[8px] font-black text-amber-500/60 uppercase tracking-tighter">{f.reason}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. Risky Features */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Risk Vectors</span>
                    </div>
                    <span className="text-[9px] font-black text-rose-500/40 uppercase tracking-widest">{data.risky_features.length} detected</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    {data.risky_features.map(f => (
                        <div key={f.name} className="flex items-center justify-between p-4 rounded-2xl bg-rose-500/[0.03] border border-rose-500/10">
                            <span className="text-[11px] font-black text-slate-100 uppercase tracking-tight">{f.name}</span>
                            <span className="text-[8px] font-black text-rose-500/60 uppercase tracking-tighter">{f.reason}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Low Value Features */}
            <div className="pt-8 border-t border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Ban className="w-3.5 h-3.5 text-slate-600" />
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Redundant Entropy</span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {data.low_value_features.map(f => (
                        <span key={f.name} className="bg-white/5 px-3 py-1.5 rounded-lg text-[8px] font-black text-slate-500 border border-white/5 uppercase">
                            {f.name}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
}
