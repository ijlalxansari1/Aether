import React from 'react';
import { BookOpen, Sparkles, Terminal } from 'lucide-react';
import { StoryResult } from '../../types/analysis';

export default function StoryEngine({ story }: { story: StoryResult }) {
  return (
    <div className="glass-morphic rounded-[3rem] p-12 overflow-hidden relative border-none shadow-[0_32px_80px_rgba(0,0,0,0.5)] ring-1 ring-white/10 group h-full flex flex-col justify-center">
      {/* Dynamic background accents */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[rgb(var(--accent))]/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[rgb(var(--accent))]/20 rounded-full blur-[120px] animate-pulse" />

      <div className="relative">
        <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-[rgb(var(--accent))]/10 border border-[rgb(var(--accent))]/20 flex items-center justify-center text-[rgb(var(--accent))]">
                <BookOpen className="w-6 h-6" />
            </div>
            <div>
                <h3 className="text-[10px] font-black text-[rgb(var(--accent))] opacity-80 uppercase tracking-[0.5em] mb-1">Adaptive Narrative</h3>
                <p className="text-3xl font-black text-white uppercase tracking-tighter">{story.title}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
                {story.chapters.map((chapter, i) => (
                    <div key={i} className="flex gap-6 group/chapter">
                        <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full border-2 border-[rgb(var(--accent))] group-hover/chapter:bg-[rgb(var(--accent))] transition-all shadow-[0_0_15px_var(--accent-glow)]" />
                            {i < story.chapters.length - 1 && <div className="w-0.5 flex-1 bg-white/5 my-2" />}
                        </div>
                        <p className="text-xl font-bold text-slate-200 leading-[1.6] tracking-tight group-hover/chapter:text-white transition-colors">
                            {chapter}
                        </p>
                    </div>
                ))}
            </div>

            <div className="bg-white/[0.03] rounded-[2.5rem] p-10 border border-white/5 flex flex-col items-center justify-center text-center space-y-6">
                <Sparkles className="w-12 h-12 text-amber-400/80 animate-float" />
                <div className="space-y-2">
                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Intelligence Verdict</h4>
                    <p className="text-2xl font-black text-white uppercase tracking-tighter">{story.system_verdict}</p>
                </div>
                <div className="pt-6 border-t border-white/5 w-full">
                    <div className="flex items-center justify-center gap-2">
                        <Terminal className="w-3 h-3 text-emerald-400" />
                        <span className="text-[8px] font-black text-emerald-400/60 uppercase tracking-[0.3em]">Neural Map Synchronized</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
