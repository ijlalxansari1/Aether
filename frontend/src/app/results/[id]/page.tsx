"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

// Modular Components
import StepIndicator from "../../components/StepIndicator";
import SummaryCard from "../../components/SummaryCard";
import QualityDashboard from "../../components/QualityDashboard";
import EthicalPanel from "../../components/EthicalPanel";
import InsightsList from "../../components/InsightsList";
import AttributeMap from "../../components/AttributeMap";
import StoryEngine from "../../components/StoryEngine";
import FeatureIntelligence from "../../components/FeatureIntelligence";

import { Suspense } from "react";

function ResultsLoader() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const intent = searchParams.get("intent") || "exploratory";
  
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    async function fetchData() {
      // Start visual progress immediately for feedback
      timer = setInterval(() => {
          setActiveStep(prev => (prev >= 3 ? 3 : prev + 1));
      }, 800);

      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
        const res = await fetch(`${apiBase}/analyze/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ intent })
        });
        
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || "Aether could not access the dataset analysis.");
        }
        
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred during analysis.");
        setActiveStep(3); // Force completion of progress bar to show error
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
    return () => { if (timer) clearInterval(timer); };
  }, [id, intent]);

  // Priority 1: Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] glass-morphic rounded-[3rem]">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 flex items-center justify-center mb-8 border border-rose-500/20">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Intelligence Disrupted</h2>
        <p className="text-slate-400 mb-10 font-bold text-xs uppercase tracking-widest max-w-md text-center">{error}</p>
        <button 
          onClick={() => router.push("/")}
          className="bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all border border-white/10 shadow-xl"
        >
          <ArrowLeft className="w-4 h-4 inline mr-2" /> Resume New Analysis
        </button>
      </div>
    );
  }

  // Priority 2: Loading / Initialization State
  if (loading || activeStep < 1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] glass-morphic rounded-[3rem]">
        <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-white/5 border-t-[rgb(var(--accent))] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-xl drop-shadow-lg">🧠</div>
        </div>
        <h2 className="text-[10px] font-black text-[rgb(var(--accent))] mt-8 tracking-[0.4em] uppercase">AETHER is scanning metadata...</h2>
        <p className="text-[9px] text-slate-500 mt-3 font-black uppercase tracking-[0.2em] animate-pulse">Initializing {intent?.toUpperCase()} Intelligence</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div data-theme={intent} className="space-y-16 pb-32 animate-in fade-in slide-in-from-bottom-8 duration-1000 transition-colors duration-1000">
      
      {/* System Awareness Header */}
      <div className="flex flex-wrap gap-4 items-center justify-between pb-8 border-b border-white/5">
          <div className="flex gap-4">
              <div className="px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[rgb(var(--accent))] animate-pulse shadow-[0_0_10px_rgb(var(--accent))]" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Dataset Type:</span>
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{data.profile}</span>
              </div>
              <div className="px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[rgb(var(--accent))] shadow-[0_0_10px_rgb(var(--accent))]" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Intent Mode:</span>
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{data.intent}</span>
              </div>
          </div>
          <button onClick={() => router.push("/")} className="text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-[0.3em] transition-colors">Terminate Session</button>
      </div>

      {/* Main Narrative Engine */}
      {data.story && (
        <div className="animate-in fade-in slide-in-from-top-10 duration-1000 delay-100">
            <StoryEngine story={data.story} />
        </div>
      )}

      {/* Primary IQ & Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-12">
           <SummaryCard summary={data.insights?.summary || "Analyzing signals..."} />
        </div>
        <div className="lg:col-span-12">
            <QualityDashboard quality={data.quality} />
        </div>
      </div>

      {/* Advanced Layer Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         <EthicalPanel ethical={data.ethical} />
         {data.features && <FeatureIntelligence features={data.features} />}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-600">
          <InsightsList insights={data.insights?.insights || []} />
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-700">
        <AttributeMap columns={data.eda?.columns || []} />
      </div>

      {/* BOTTOM SECTION: ACTION HUB */}
      <div className="pt-24 border-t border-white/5 animate-in fade-in duration-1000 delay-1000">
          <div className="text-center space-y-12">
              <div className="space-y-4">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">What would you like to do next?</h3>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Select a vector to continue your data journey</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  {[
                    { label: "Export Report", desc: "Download full intelligence map", icon: "📄" },
                    { label: "Improve Dataset", desc: "Automate cleaning (Preview)", icon: "✨" },
                    { label: "Run Deeper Analysis", desc: "Advanced statistical modeling", icon: "🔍" }
                  ].map((action, i) => (
                    <button 
                        key={i} 
                        className="glass-card p-8 rounded-[2.5rem] border border-white/5 hover:border-indigo-500/30 group transition-all text-left"
                    >
                        <span className="text-3xl mb-6 block grayscale group-hover:grayscale-0 transition-all">{action.icon}</span>
                        <p className="text-[11px] font-black text-white uppercase tracking-widest mb-2 group-hover:text-indigo-400 transition-all">{action.label}</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-tight leading-snug">{action.desc}</p>
                    </button>
                  ))}
              </div>

              <div className="pt-12">
                  <button 
                      onClick={() => router.push("/")}
                      className="group flex items-center justify-center w-full gap-2 text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] hover:text-rose-400 transition-all"
                  >
                      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Terminate Intelligence Session
                  </button>
              </div>
          </div>
      </div>
      
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[70vh] glass-morphic rounded-[3rem]">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        </div>
    }>
      <ResultsLoader />
    </Suspense>
  );
}
