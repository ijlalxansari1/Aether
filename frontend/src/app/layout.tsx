import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AETHER V1 - Data Understanding Engine",
  description: "Automated EDA and Ethical Scanning engine",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased overflow-x-hidden">
        <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/40 backdrop-blur-md border-b border-white/5">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl drop-shadow-lg">🧠</span>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tighter text-white leading-none">AETHER</span>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-normal">Ethical Data Intelligence Engine</span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
              <span className="hover:text-white transition-colors cursor-default">Structure</span>
              <span className="hover:text-white transition-colors cursor-default">Risks</span>
              <span className="hover:text-white transition-colors cursor-default">Quality</span>
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto p-6 lg:p-12 mt-16 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
