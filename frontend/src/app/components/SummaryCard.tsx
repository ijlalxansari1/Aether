import React from 'react';
import { BrainCircuit } from 'lucide-react';

export default function SummaryCard({ summary }: { summary: string }) {
  return (
    <div className="glass-card rounded-[2.5rem] p-10 border-none relative overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.3)]">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-[rgb(var(--accent))]" />
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[rgb(var(--accent))]/10 border border-[rgb(var(--accent))]/20 text-[rgb(var(--accent))] px-4 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--accent))] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Analysis complete</span>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confidence: High</p>
        </div>
        <BrainCircuit className="text-[rgb(var(--accent))] w-6 h-6 opacity-40" />
      </div>
      <p className="text-2xl font-bold text-slate-100 leading-[1.4] tracking-tight">
        &quot;{summary}&quot;
      </p>
    </div>
  );
}
