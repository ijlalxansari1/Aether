"use client";

import { AlertTriangle, CheckCircle, Wrench, ChevronRight, Wand2 } from "lucide-react";

interface CleaningIssue {
  issue: string;
  suggestion: string;
}

interface CleaningData {
  issues: string[];
  suggestions: string[];
}

export default function CleaningPanel({ cleaning }: { cleaning: CleaningData }) {
  if (!cleaning || (cleaning.issues.length === 0 && cleaning.suggestions.length === 0)) {
    return (
      <div className="glass-card rounded-[2.5rem] p-8 border border-emerald-500/10 bg-emerald-500/[0.02]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Data Cleaning Report</h3>
        </div>
        <p className="text-[11px] text-emerald-400 font-bold">✓ No cleaning issues detected. Dataset is structurally clean.</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-[2.5rem] p-8 border border-white/5 space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Wand2 className="w-4 h-4 text-orange-400" />
        </div>
        <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">System Cleaning Recommendations</h3>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Required transformations prior to ingestion</p>
        </div>
      </div>

      {/* Issues */}
      {cleaning.issues.length > 0 && (
        <div className="space-y-2">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Issues</p>
          {cleaning.issues.slice(0, 5).map((issue, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10">
              <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] font-bold text-slate-300">{issue}</p>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {cleaning.suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Recommendations</p>
          {cleaning.suggestions.slice(0, 5).map((sug, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
              <ChevronRight className="w-3 h-3 text-indigo-400 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] font-bold text-slate-300">{sug}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
