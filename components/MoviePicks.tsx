'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, Star } from 'lucide-react';
import { posterUrl } from '@/lib/posterUrl';
import type { Movie } from '@/lib/types';

export default function MoviePicks({ movies }: { movies: Movie[] }) {
  const picks = [...movies]
    .filter((movie) => !movie.is_watched && (movie.vote_average ?? 0) > 0)
    .sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
    .slice(0, 3);

  if (picks.length === 0) return null;

  return (
    <section aria-labelledby="cinegrid-picks" className="rounded-xl border border-cinema-accent/25 bg-cinema-surface p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Sparkles size={17} className="text-cinema-gold" />
        <div>
          <h2 id="cinegrid-picks" className="text-sm font-semibold text-white">CineGrid-Tipps</h2>
          <p className="text-[11px] text-cinema-muted">Drei Filme für deinen nächsten Abend</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {picks.map((movie) => {
          const poster = posterUrl(movie.poster_path, 'w342');
          return (
            <Link key={movie.tmdb_id} href={`/movie/${movie.tmdb_id}`} className="group flex min-w-0 gap-3 rounded-lg border border-cinema-border bg-cinema-surface2 p-2.5 transition-colors hover:border-cinema-accent">
              <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-cinema-bg">
                {poster && <Image src={poster} alt={movie.title} fill className="object-cover transition-transform group-hover:scale-105" sizes="56px" />}
              </div>
              <div className="min-w-0">
                <p className="line-clamp-2 text-xs font-semibold text-white">{movie.title}</p>
                <p className="mt-1 text-[11px] text-cinema-muted">{movie.release_year ?? '—'}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-cinema-gold"><Star size={11} fill="currentColor" /> {(movie.vote_average ?? 0).toFixed(1)} TMDB</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
