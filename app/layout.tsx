import type { Metadata } from 'next';
import { Inter, Bebas_Neue } from 'next/font/google';
import './globals.css';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });
const display = Bebas_Neue({ subsets: ['latin'], weight: '400', variable: '--font-display' });

export const metadata: Metadata = {
  title: 'CineGrid – Entdecke deine Lieblingsfilme & Streaming-Highlights',
  description: 'Entdecke Lieblingsfilme, verwalte deine persönliche Watchlist und finde die besten Streaming-Highlights mit CineGrid.',
  keywords: [
    'CineGrid',
    'Filme entdecken',
    'Watchlist',
    'Lieblingsfilme',
    'Streaming-Highlights',
    'Filmempfehlungen',
    'Kinofilme',
  ],
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: 'https://cinegrid.de',
    siteName: 'CineGrid',
    title: 'CineGrid – Entdecke deine Lieblingsfilme & Streaming-Highlights',
    description: 'Entdecke Lieblingsfilme, verwalte deine persönliche Watchlist und finde die besten Streaming-Highlights mit CineGrid.',
  },
  alternates: {
    canonical: 'https://cinegrid.de',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="dark">
      <body className={`${sans.variable} ${display.variable} bg-cinema-bg text-cinema-text font-sans antialiased min-h-screen bg-cinema-gradient`}>
        {children}
      </body>
    </html>
  );
}
