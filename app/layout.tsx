import type { Metadata } from 'next';
import { Inter, Bebas_Neue } from 'next/font/google';
import './globals.css';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });
const display = Bebas_Neue({ subsets: ['latin'], weight: '400', variable: '--font-display' });
const brandTagline = 'CineGrid – Deine digitale Film-Datenbank und Watchlist für cineastische Meisterwerke.';

export const metadata: Metadata = {
  title: 'CineGrid – Entdecke deine Lieblingsfilme & Streaming-Highlights',
  description: brandTagline,
  keywords: [
    'CineGrid',
    'Filme entdecken',
    'Film-Watchlist',
    'Lieblingsfilme',
    'digitale Film-Datenbank',
    'cineastische Meisterwerke',
    'Klassiker streamen',
    'Filmklassiker',
    'Klassiker Filme',
    'beste Filme aller Zeiten',
    'Filme verwalten',
    'Filmliste',
    'Filmtipps',
    'Streaming-Highlights',
    'Streaming Filme',
    'Streaming Empfehlungen',
    'Filmempfehlungen',
    'Filme online entdecken',
    'Kino',
    'Kinofilme',
    'neue Kinofilme',
    'kommende Filme',
    'Filmübersicht',
    'Filmdatenbank',
    'Filmtracking',
    'Filme tracken',
    'Watchlist App',
    'Film-App',
    'TMDB Filme',
    'TMDB Movie Database',
    'cinematic database',
    'movie database',
    'movie watchlist',
    'film tracker',
    'cinema tracker',
  ],
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: 'https://cinegrid.de',
    siteName: 'CineGrid',
    title: 'CineGrid – Entdecke deine Lieblingsfilme & Streaming-Highlights',
    description: brandTagline,
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
