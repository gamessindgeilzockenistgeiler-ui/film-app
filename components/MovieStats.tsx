'use client';

import { BarChart3, CalendarDays, Star, Trophy } from 'lucide-react';
import type { Movie } from '@/lib/types';

export default function MovieStats({ movies }: { movies: Movie[] }) {
  const watched = movies.filter((movie) => movie.is_watched);
  const rated = movies.filter((movie) => movie.user_rating !== null && movie.user_rating !== undefined);
  const average = rated.length > 0
    ? rated.reduce((sum, movie) => sum + (movie.user_rating ?? 0), 0) / rated.length
    : 0;
  const genreCounts = watched.flatMap((movie) => movie.genres).reduce<Record<string, number>>((counts, genre) => {
    counts[genre] = (counts[genre] ?? 0) + 1;
    return counts;
  }, {});
  const topGenre = Object.entries(genreCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'Noch offen';
  const watchedYears = watched.reduce<Record<string, number>>((years, movie) => {
    const year = movie.release_year ? String(movie.release_year) : 'Unbekannt';
    years[year] = (years[year] ?? 0) + 1;
    return years;
  }, {});
  const topYear = Object.entries(watchedYears).sort(([, a], [, b]) => b - a)[0]?.[0] ?? '—';

  const stats = [
    { label: 'Gesehen', value: String(watched.length), detail: `${movies.length} Filme insgesamt`, icon: Trophy },
    { label: 'Dein Schnitt', value: rated.length ? `${average.toFixed(1)}/10` : '—', detail: `${rated.length} eigene Wertungen`, icon: Star },
    { label: 'Top-Genre', value: topGenre, detail: watched.length ? `${genreCounts[topGenre]} gesehene Filme` : 'Noch keine Daten', icon: BarChart3 },
    { label: 'Filmjahr', value: topYear, detail: 'Am häufigsten gesehen', icon: CalendarDays },
  ];

  return (
    <section aria-label="Deine Filmstatistiken" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(({ label, value, detail, icon: Icon }) => (
        <div key={label} className="rounded-xl border border-cinema-border bg-cinema-surface p-4">
          <div className="flex items-center justify-between gap-2 text-xs text-cinema-muted">
            <span>{label}</span>
            <Icon size={16} className="text-cinema-accent" />
          </div>
          <p className="mt-3 truncate text-lg font-semibold text-white">{value}</p>
          <p className="mt-1 truncate text-[11px] text-cinema-muted">{detail}</p>
        </div>
      ))}
    </section>
  );
}
