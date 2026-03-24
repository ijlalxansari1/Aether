"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, AlertCircle, ChevronRight, MessageSquare } from "lucide-react";

interface Message {
  role: "user" | "aether";
  content: string;
  actions?: any[];
}

export default function AskAether({ datasetId }: { datasetId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "aether", content: "I have analyzed your dataset. What would you like to explore? I can help with feature importance, risk assessment, or quality improvements." }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
        const res = await fetch(`${apiBase}/agent/${datasetId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: text })
        });

        if (!res.ok) throw new Error("Aether connection disrupted.");
        
        const data = await res.json();
        setMessages(prev => [...prev, { 
            role: "aether", 
            content: data.answer,
            actions: data.actions 
        }]);
    } catch (err: any) {
        setMessages(prev => [...prev, { role: "aether", content: "I'm sorry, I'm having trouble accessing the analysis context right now. Please try again." }]);
    } finally {
        setIsTyping(false);
    }
  };

  const suggestions = [
    "What are the risky features?",
    "How is the data quality?",
    "What should I do next?",
    "Summarize this dataset"
  ];

  return (
    <div className="glass-card rounded-[2.5rem] border border-white/5 flex flex-col h-[600px] overflow-hidden sticky top-8">
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Ask AETHER</h3>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Interactive Agent v4.0</p>
                </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black text-emerald-400 uppercase">Context Active</span>
            </div>
        </div>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-3xl p-4 text-[11px] font-bold leading-relaxed ${
                        msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-white/5 text-slate-200 border border-white/5 rounded-tl-none'
                    }`}>
                        {typeof msg.content === 'string' ? msg.content : (
                          <div className="space-y-2">
                             <p className="opacity-50 text-[8px] uppercase tracking-widest">Retrieved Intelligence Context:</p>
                             <pre className="text-[9px] p-3 bg-black/40 rounded-xl overflow-x-auto font-mono text-indigo-300 border border-indigo-500/20">
                                {JSON.stringify(msg.content, null, 2)}
                             </pre>
                          </div>
                        )}
                        
                        {msg.actions && msg.actions.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                                <p className="text-[9px] uppercase tracking-widest text-indigo-400 mb-2 font-black">Guided Recommendations:</p>
                                {msg.actions.map((action, ai) => (
                                    <div key={ai} className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all">
                                        <p className="font-black text-white text-[10px] uppercase mb-1">{action.label}</p>
                                        <p className="text-slate-500 text-[9px]">{action.action}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {isTyping && (
                <div className="flex justify-start">
                    <div className="bg-white/5 rounded-3xl p-4 py-3 border border-white/5 rounded-tl-none">
                        <div className="flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-slate-500 animate-bounce" />
                            <div className="w-1 h-1 rounded-full bg-slate-500 animate-bounce delay-100" />
                            <div className="w-1 h-1 rounded-full bg-slate-500 animate-bounce delay-200" />
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Footer / Input */}
        <div className="p-6 bg-white/[0.01] border-t border-white/5 space-y-4">
            {/* Suggested Questions */}
            {messages.length < 3 && (
                <div className="flex flex-wrap gap-2">
                    {suggestions.map((s, i) => (
                        <button 
                            key={i}
                            onClick={() => handleSend(s)}
                            className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-[9px] font-black text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all uppercase tracking-tight"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            <div className="relative">
                <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                    placeholder="Ask about features, risks, or next steps..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-[11px] font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                />
                <button 
                    onClick={() => handleSend(input)}
                    className="absolute right-2 top-2 bottom-2 w-10 rounded-xl bg-indigo-600 flex items-center justify-center hover:bg-indigo-500 transition-all"
                >
                    <Send className="w-4 h-4 text-white" />
                </button>
            </div>
        </div>
    </div>
  );
}
