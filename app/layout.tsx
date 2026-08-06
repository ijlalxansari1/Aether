import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import GlobalSidebar from '@/components/GlobalSidebar';
import TopNavigation from '@/components/TopNavigation';

export const metadata: Metadata = {
  title: 'Aether — End-to-End DataOps Platform',
  description: 'Ingest, Store, Clean, Analyze, Story, and Dashboard your data — all in one place.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <div className="app-layout">
            <GlobalSidebar />
            <div className="app-root" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              <TopNavigation />
              {children}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
