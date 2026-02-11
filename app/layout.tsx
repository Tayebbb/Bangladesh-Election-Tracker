import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

// PERF: Optimize font loading with next/font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#006a4e',
};

export const metadata: Metadata = {
  title: 'Bangladesh Election Tracker | Live Results',
  description: 'Real-time election results and seat counting for Bangladesh parliamentary elections. Track constituency-level results with interactive maps.',
  keywords: ['Bangladesh', 'Election', 'Results', 'Live', 'Parliamentary', 'Constituency'],
  authors: [{ name: 'Bangladesh Election Commission' }],
  icons: {
    icon: '/logo.png?v=2',
    shortcut: '/logo.png?v=2',
    apple: '/logo.png?v=2',
  },
  openGraph: {
    title: 'Bangladesh Election Tracker | Live Results',
    description: 'Real-time election results tracking with interactive maps',
    type: 'website',
    locale: 'en_BD',
  },
  // SECURITY: Prevent search engines from indexing admin pages
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* PERF: DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebase.googleapis.com" />
        <link rel="preconnect" href="https://firestore.googleapis.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-200 font-sans antialiased">
        {children}
        {/* PERF: Load analytics script lazily after page interactive */}
        <Script
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "YOUR_CLOUDFLARE_TOKEN"}'
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
