// Reine, überall (Client & Server) sichere Hilfsfunktion ohne Secrets-Zugriff.
export function posterUrl(path: string | null, size: 'w342' | 'w500' | 'w780' = 'w500') {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
