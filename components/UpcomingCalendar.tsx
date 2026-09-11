'use client';

import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import type { Movie } from '@/lib/types';
import { isUpcomingMovie } from '@/lib/movieAvailability';

export default function UpcomingCalendar({ movies }: { movies: Movie[] }) {
  const upcomingMovies = movies
    .filter((movie) => isUpcomingMovie(movie) && movie.release_date)
    .sort((a, b) => (a.release_date ?? '').localeCompare(b.release_date ?? ''))
    .slice(0, 12);

  if (upcomingMovies.length === 0) return null;

  const groupedMovies = upcomingMovies.reduce<Record<string, Movie[]>>((groups, movie) => {
    const month = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(new Date(`${movie.release_date}T00:00:00`));
    groups[month] = [...(groups[month] ?? []), movie];
    return groups;
  }, {});

  return (
    <section aria-labelledby="upcoming-calendar" className="rounded-xl border border-cinema-border bg-cinema-surface p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <CalendarDays size={17} className="text-cinema-accent" />
        <div>
          <h2 id="upcoming-calendar" className="text-sm font-semibold text-white">Demnächst im Kino</h2>
          <p className="text-[11px] text-cinema-muted">Die nächsten Kinostarts deiner Liste</p>
        </div>
      </div>
      <div className="mt-4 space-y-4">
        {Object.entries(groupedMovies).map(([month, monthMovies]) => (
          <div key={month}>
            <h3 className="mb-2 text-xs font-semibold capitalize text-cinema-gold">{month}</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {monthMovies.map((movie) => (
                <Link key={movie.tmdb_id} href={`/movie/${movie.tmdb_id}`} className="flex items-center gap-3 rounded-lg border border-cinema-border bg-cinema-surface2 px-3 py-2 transition-colors hover:border-cinema-accent">
                  <time dateTime={movie.release_date} className="w-10 shrink-0 text-center text-xs font-semibold text-white">
                    {new Intl.DateTimeFormat('de-DE', { day: '2-digit' }).format(new Date(`${movie.release_date}T00:00:00`))}
                  </time>
                  <span className="line-clamp-2 text-xs text-cinema-muted">{movie.title}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
