import { Lightbulb } from "lucide-react";

export default function InsightsList({ insights }: { insights: string[] }) {
  return (
    <div className="glass-morphic rounded-[3rem] p-10 flex flex-col h-full border-none">
        <div className="flex items-center gap-4 mb-12">
            <div className="bg-amber-500/10 p-4 rounded-[2rem] border border-amber-500/20 shadow-xl">
                <Lightbulb className="w-7 h-7 text-amber-500" />
            </div>
            <div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Inferred Patterns</h4>
                <p className="text-2xl font-black text-white uppercase tracking-tighter">Structural Intelligence</p>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-8 flex-1">
            {insights.map((insight, idx) => {
                const parts = insight.split(" \u2192 ");
                return (
                    <div key={idx} className="group relative bg-white/[0.02] p-6 rounded-[2rem] border border-white/[0.05] hover:border-indigo-500/20 transition-all">
                        <div className="flex flex-col gap-4">
                            {parts.map((part, pIdx) => (
                                <div key={pIdx} className="flex items-start gap-3">
                                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${pIdx === 0 ? 'bg-indigo-400' : pIdx === 1 ? 'bg-amber-400/60' : 'bg-emerald-400/60 shadow-[0_0_10px_rgba(52,211,153,0.3)]'}`} />
                                    <p className={`text-[11px] font-black uppercase tracking-tight leading-snug ${pIdx === 0 ? 'text-slate-100' : pIdx === 1 ? 'text-slate-400' : 'text-emerald-400/80'}`}>
                                        <span className="opacity-40 mr-2">{pIdx === 0 ? "OBS:" : pIdx === 1 ? "IMP:" : "REC:"}</span>
                                        {part}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
}
