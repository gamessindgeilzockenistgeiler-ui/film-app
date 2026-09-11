import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CineGrid - Deine Film-Watchlist',
    short_name: 'CineGrid',
    description: 'Entdecke Filme, verwalte deine Watchlist und verfolge deinen Filmfortschritt.',
    start_url: '/',
    display: 'standalone',
    background_color: '#08090c',
    theme_color: '#e50914',
    lang: 'de',
  };
}
