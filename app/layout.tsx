import type { Metadata } from 'next';
import { Inter, Bebas_Neue } from 'next/font/google';
import './globals.css';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });
const display = Bebas_Neue({ subsets: ['latin'], weight: '400', variable: '--font-display' });

export const metadata: Metadata = {
  title: 'CineGrid — Dein Film-Dashboard',
  description: 'CineGrid: Verfolge Klassiker, verwalte deine Watchlist und entdecke neue Filme.',
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
