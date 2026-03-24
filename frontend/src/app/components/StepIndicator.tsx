import { Search, CheckCircle } from "lucide-react";

export default function StepIndicator({ activeStep }: { activeStep: number }) {
  const steps = [
    { label: "Structure Scan", icon: Search },
    { label: "Ethical Scan", icon: Search },
    { label: "Quality Engine", icon: Search },
  ];

  return (
    <div className="flex items-center justify-between bg-white/5 backdrop-blur-md px-8 py-5 rounded-[2rem] border border-white/10 shadow-sm">
      <div className="flex items-center gap-8">
        {steps.map((step, i) => (
          <div key={i} className={`flex items-center gap-2 transition-all duration-700 ${activeStep > i ? 'opacity-100 scale-100' : 'opacity-20 scale-95'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${i < activeStep ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-slate-500'}`}>
              {i < activeStep ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">{step.label}</span>
            {i < 2 && <div className="w-8 h-px bg-white/5 ml-2" />}
          </div>
        ))}
      </div>
      <div className="hidden md:block">
        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] animate-pulse">Analysis Live</p>
      </div>
    </div>
  );
}
