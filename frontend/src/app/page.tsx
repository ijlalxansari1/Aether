"use client";

import { useState, useEffect } from "react";
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Search, 
  ShieldCheck, 
  Wand2,
  ChevronRight,
  Database,
  BarChart3,
  ArrowLeft
} from "lucide-react";

import { runFullAnalysis } from "../lib/api";
import { AnalysisResponse, InsightsResult } from "../types/analysis";

import QualityDashboard from "./components/QualityDashboard";
import EthicalPanel from "./components/EthicalPanel";
import AttributeMap from "./components/AttributeMap";
import StoryEngine from "./components/StoryEngine";
import FeatureIntelligence from "./components/FeatureIntelligence";

// --- Inline Components ---

const IQScoreGauge = ({ score }: { score: number }) => {
  const radius = 80;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const colorClass = score > 80 ? 'text-[--risk-low]' : score > 50 ? 'text-[--risk-medium]' : 'text-[--risk-high]';
  const bgPulseClass = score > 80 ? 'bg-[--risk-low]' : score > 50 ? 'bg-[--risk-medium]' : 'bg-[--risk-high]';

  return (
    <div className="glass-card rounded-[3rem] p-10 flex flex-col items-center justify-center text-center h-full border-none shadow-[0_24px_64px_rgba(0,0,0,0.3)]">
      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle
            stroke="rgba(255,255,255,0.05)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className={`${colorClass} transition-all duration-1000 ease-out`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-5xl font-black text-white">{score}</span>
      </div>
      <div className="mt-8 space-y-2">
        <p className="text-xl font-black text-white uppercase tracking-tight">Intelligence Quotient</p>
        <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${bgPulseClass} animate-pulse`} />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Mapping Complete</span>
        </div>
      </div>
    </div>
  );
};

const InsightsPanel = ({ insights }: { insights: InsightsResult }) => (
  <div className="glass-card rounded-[3rem] p-10 border-none shadow-[0_24px_64px_rgba(0,0,0,0.3)]">
    <div className="border-l-4 border-[rgb(var(--accent))] pl-6 mb-8 py-2">
      <p className="text-xl font-black text-slate-300 italic tracking-tight">&quot;{insights.summary}&quot;</p>
    </div>
    <div className="space-y-4">
      {insights.insights.map((insight, idx) => (
        <div key={idx} className="flex items-start gap-4">
          <ChevronRight className="w-5 h-5 text-[rgb(var(--accent))] shrink-0 mt-0.5" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">{insight}</p>
        </div>
      ))}
    </div>
  </div>
);

// --- Loading Overlay ---

const LoadingOverlay = () => {
  const [msgIdx, setMsgIdx] = useState(0);
  const messages = [
    "Initializing intelligence pipeline...",
    "Scanning structural patterns...",
    "Running ethical compliance check...",
    "Computing quality metrics...",
    "Generating intelligence story...",
    "Finalizing IQ score..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % messages.length);
    }, 800);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D1B2A]/90 backdrop-blur-md animate-in fade-in duration-500">
      <div className="flex flex-col items-center justify-center">
        <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-white/5 border-t-[rgb(var(--accent))] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-3xl drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">🧠</div>
        </div>
        <div className="mt-12 h-8 relative overflow-hidden w-96 flex items-center justify-center">
            <h2 key={msgIdx} className="absolute text-[10px] font-black text-[rgb(var(--accent))] tracking-[0.4em] uppercase animate-in slide-in-from-bottom-4 fade-in duration-300">
              {messages[msgIdx]}
            </h2>
        </div>
      </div>
    </div>
  );
};


// --- Main Page Component ---

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState("exploratory");
  
  const [results, setResults] = useState<AnalysisResponse | null>(null);

  const intents = [
    { id: "exploratory", label: "Exploratory", icon: "🔍", desc: "Discover patterns and structure", color: "var(--accent-purple)" },
    { id: "ml_focused", label: "ML Focused", icon: "🤖", desc: "Feature readiness and signal", color: "var(--accent-blue)" },
    { id: "business", label: "Business", icon: "📈", desc: "Actionable trends and ROI", color: "var(--accent-amber)" },
    { id: "cleaning", label: "Cleaning", icon: "✨", desc: "Health and integrity focus", color: "var(--accent-teal)" }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (!['csv', 'xlsx', 'xls', 'json', 'pdf', 'docx'].includes(ext || '')) {
        setError("Unsupported format. Please upload CSV, XLSX, JSON, PDF, or DOCX.");
        return;
      }
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError("File too large. Maximum size is 50MB.");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);

    try {
      const analysisData = await runFullAnalysis(file, intent);
      setResults(analysisData);
    } catch (err: any) {
      if (err.message && err.message.includes("Session expired")) {
        setError("Session expired — please re-upload");
        setFile(null);
      } else {
        setError(err.message || "Analysis failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetSession = () => {
    setResults(null);
    setFile(null);
    setError(null);
  };

  // --- STATE 2: RESULTS ---
  if (results) {
    // Determine layout based on intent
    const isExploratory = results.intent === 'exploratory';
    const isMLFocused = results.intent === 'ml_focused';
    const isBusiness = results.intent === 'business';
    const isCleaning = results.intent === 'cleaning';

    return (
      <div data-theme={results.intent} className="space-y-10 pt-8 pb-32 px-4 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 transition-colors">
        
        {/* Top actions & session indicator */}
        <div className="flex flex-wrap gap-4 items-center justify-between pb-8 border-b border-[var(--border-glass)]">
            <button onClick={resetSession} className="group flex items-center gap-2 text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-[0.4em] transition-all">
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> New Analysis
            </button>
            <div className="px-6 py-2 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-glass)] flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--accent))] animate-pulse shadow-[0_0_10px_rgb(var(--accent))]" />
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">SESSION: {results.session_id.substring(0, 8)}</span>
            </div>
        </div>

        {/* --- DYNAMIC GRID LAYOUTS --- */}

        {isExploratory && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4"><IQScoreGauge score={results.iq_score} /></div>
              <div className="lg:col-span-8">{results.story && <StoryEngine story={results.story} />}</div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div><EthicalPanel ethical={results.ethical} /></div>
              <div>{results.features && <FeatureIntelligence features={results.features} />}</div>
            </div>
            <div className="w-full"><AttributeMap columns={results.eda.columns} /></div>
            <div className="w-full"><InsightsPanel insights={results.insights} /></div>
          </>
        )}

        {isMLFocused && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4"><IQScoreGauge score={results.iq_score} /></div>
              <div className="lg:col-span-8">{results.features && <FeatureIntelligence features={results.features} />}</div>
            </div>
            <div className="w-full"><EthicalPanel ethical={results.ethical} /></div>
            <div className="w-full"><AttributeMap columns={results.eda.columns} /></div>
          </>
        )}

        {isBusiness && (
          <>
            <div className="w-full">{results.story && <StoryEngine story={results.story} />}</div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4"><IQScoreGauge score={results.iq_score} /></div>
              <div className="lg:col-span-8"><QualityDashboard quality={results.quality} /></div>
            </div>
            <div className="w-full"><AttributeMap columns={results.eda.columns} /></div>
          </>
        )}

        {isCleaning && (
          <>
            <div className="w-full"><QualityDashboard quality={results.quality} /></div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4"><IQScoreGauge score={results.iq_score} /></div>
              <div className="lg:col-span-8"><EthicalPanel ethical={results.ethical} /></div>
            </div>
            <div className="w-full"><AttributeMap columns={results.eda.columns} /></div>
          </>
        )}

      </div>
    );
  }

  // --- STATE 1: INPUT ---
  return (
    <div className="flex flex-col items-center pt-12 pb-24 px-4 max-w-5xl mx-auto animate-in fade-in duration-1000">
      
      {isLoading && <LoadingOverlay />}
      
      {/* Hero Section */}
      <div className="text-center mb-24 max-w-3xl">
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[var(--bg-glass)] border border-[var(--border-glass)] text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] mb-8 animate-float shadow-xl">
          <Wand2 className="w-3.5 h-3.5 text-indigo-400" /> AETHER Engine V3
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-6 leading-tight">
          Ethical Data <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 bg-[length:200%_auto] animate-gradient">Intelligence.</span>
        </h1>
        <p className="text-base text-[var(--text-muted)] max-w-xl mx-auto font-medium leading-relaxed">
          Premium structural, statistical, and ethical pattern recognition.
        </p>
      </div>

      <div className="w-full space-y-20">
        
        {/* Intent Selector */}
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <div className="text-center space-y-3">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Select Analysis Vector</h3>
              <p className="text-[9px] font-black text-[var(--text-subtle)] uppercase tracking-[0.4em]">Intelligence adapts to your mission</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {intents.map((item) => {
                const isSelected = intent === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setIntent(item.id)}
                    className={`relative glass-card p-6 rounded-[2rem] border transition-all text-left group ${
                        isSelected ? 'bg-white/5 border-white/20' : 'border-[var(--border-glass)] hover:border-white/10'
                    }`}
                    style={isSelected ? { boxShadow: `0 0 30px ${item.color}30`, borderColor: `${item.color}50` } : {}}
                  >
                    <span className={`text-2xl mb-4 block transition-all ${isSelected ? 'grayscale-0 scale-110' : 'grayscale group-hover:grayscale-0'}`}>{item.icon}</span>
                    <p className={`text-[11px] font-black uppercase tracking-widest mb-1 transition-colors`} style={isSelected ? { color: item.color } : { color: 'var(--text-primary)' }}>{item.label}</p>
                    <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-tight leading-snug">{item.desc}</p>
                    
                    {isSelected && (
                      <div className="absolute top-5 right-5 w-1.5 h-1.5 rounded-full shadow-lg" style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}` }} />
                    )}
                  </button>
                );
              })}
            </div>
        </div>

        {/* File Upload Component */}
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
            <div className="text-center space-y-3">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Initialize Source</h3>
              <p className="text-[9px] font-black text-[var(--text-subtle)] uppercase tracking-[0.4em]">Aether normalizes all inputs</p>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="glass-morphic relative rounded-[3rem] p-10 min-h-[350px] flex flex-col items-center justify-center transition-all duration-700 hover:shadow-indigo-500/10 border-2 border-dashed border-[var(--border-glass)]">
                  {!file ? (
                    <div className="flex flex-col items-center justify-center animate-in zoom-in-95 duration-500 w-full h-full relative cursor-pointer" onClick={() => document.getElementById('fileUpload')?.click()}>
                      <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center mb-8 shadow-inner group-hover:bg-indigo-500/10 transition-colors">
                        <UploadCloud className="w-8 h-8 text-indigo-400" />
                      </div>
                      <span className="bg-white text-slate-950 px-10 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-indigo-400 hover:text-white transition-all shadow-xl">
                        Select Document
                      </span>
                      <input 
                        id="fileUpload"
                        type="file" 
                        className="hidden" 
                        accept=".csv, .xlsx, .xls, .json, .pdf, .docx, application/pdf, application/json" 
                        onChange={handleFileChange} 
                      />
                      <p className="text-[8px] text-[var(--text-subtle)] mt-6 font-black uppercase tracking-[0.3em]">CSV &bull; XLSX &bull; PDF &bull; DOCX &bull; JSON</p>
                    </div>
                  ) : (
                    <div className="w-full space-y-8 animate-in slide-in-from-bottom-4 duration-500 relative z-10">
                      <div className="flex items-center space-x-5 bg-[var(--bg-glass)] p-6 rounded-3xl w-full border border-[var(--border-glass)]">
                        <div className="w-12 h-12 rounded-xl bg-[rgb(var(--accent))]/10 border border-[rgb(var(--accent))]/20 flex items-center justify-center">
                            <FileSpreadsheet className="w-6 h-6 text-[rgb(var(--accent))]" />
                        </div>
                        <div className="flex-1 overflow-hidden text-left">
                          <p className="text-[11px] font-black text-white truncate uppercase tracking-tight">{file.name}</p>
                          <p className="text-[9px] font-black text-[var(--text-muted)] tracking-[0.2em] uppercase mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB &bull; Stage Ready</p>
                        </div>
                        <button onClick={() => { setFile(null); setError(null); }} className="text-[var(--text-subtle)] hover:text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] px-4 transition-colors">Discard</button>
                      </div>
                      <button onClick={handleUpload} disabled={isLoading} className="w-full h-16 bg-white hover:bg-[rgb(var(--accent))] hover:text-white text-slate-950 rounded-2xl font-black uppercase tracking-[0.3em] transition-all shadow-[0_20px_40px_rgba(0,0,0,0.4)] disabled:opacity-50">
                        Analyze
                      </button>
                    </div>
                  )}

                  {error && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 text-rose-400 bg-rose-500/10 px-8 py-3 rounded-2xl w-[90%] border border-rose-500/20 animate-in slide-in-from-bottom-2 duration-300">
                      <span className="text-[10px] font-black uppercase tracking-[0.1em]">{error}</span>
                    </div>
                  )}
              </div>
            </div>
        </div>
      </div>

    </div>
  );
}
