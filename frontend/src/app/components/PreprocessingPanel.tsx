"use client";

import { Cpu, Tag, BarChart2, Calendar } from "lucide-react";

interface PreprocessingData {
  encoding_required: { column: string; strategy: string; reason: string }[];
  scaling_required: { column: string; strategy: string; reason: string }[];
  transformations: { column: string; strategy: string; reason: string }[];
}

function PreprocessItem({ item, icon: Icon, color }: { item: any; icon: any; color: string }) {
  return (
    <div className={`p-4 rounded-2xl border flex items-start gap-3 ${color}`}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-70" />
      <div>
        <p className="text-[10px] font-black text-white uppercase">{item.column}</p>
        <p className="text-[10px] font-bold text-indigo-300">{item.strategy}</p>
        <p className="text-[9px] text-slate-500 mt-0.5">{item.reason}</p>
      </div>
    </div>
  );
}

export default function PreprocessingPanel({ preprocessing }: { preprocessing: PreprocessingData }) {
  const total = (preprocessing?.encoding_required?.length || 0) +
    (preprocessing?.scaling_required?.length || 0) +
    (preprocessing?.transformations?.length || 0);

  if (!preprocessing || total === 0) {
    return (
      <div className="glass-card rounded-[2.5rem] p-8 border border-emerald-500/10 bg-emerald-500/[0.02]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Preprocessing Needs</h3>
        </div>
        <p className="text-[11px] text-emerald-400 font-bold">✓ No preprocessing transformations required.</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-[2.5rem] p-8 border border-white/5 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
          <Cpu className="w-4 h-4 text-violet-400" />
        </div>
        <div>
          <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Preprocessing Needs</h3>
          <p className="text-[9px] text-violet-400 font-black uppercase tracking-tighter">{total} transformation(s) required</p>
        </div>
      </div>

      {preprocessing.encoding_required.length > 0 && (
        <div className="space-y-2">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Encoding</p>
          {preprocessing.encoding_required.map((item, i) => (
            <PreprocessItem key={i} item={item} icon={Tag} color="bg-indigo-500/5 border-indigo-500/10" />
          ))}
        </div>
      )}

      {preprocessing.scaling_required.length > 0 && (
        <div className="space-y-2">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Scaling</p>
          {preprocessing.scaling_required.map((item, i) => (
            <PreprocessItem key={i} item={item} icon={BarChart2} color="bg-violet-500/5 border-violet-500/10" />
          ))}
        </div>
      )}

      {preprocessing.transformations.length > 0 && (
        <div className="space-y-2">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Datetime Transformations</p>
          {preprocessing.transformations.map((item, i) => (
            <PreprocessItem key={i} item={item} icon={Calendar} color="bg-sky-500/5 border-sky-500/10" />
          ))}
        </div>
      )}
    </div>
  );
}
