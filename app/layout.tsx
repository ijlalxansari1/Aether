import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aether — End-to-End DataOps Platform',
  description: 'Ingest, Store, Clean, Analyze, Story, and Dashboard your data — all in one place.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
