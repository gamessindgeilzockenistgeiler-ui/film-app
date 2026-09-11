'use client';

import Image from 'next/image';
import { Check, Clapperboard, Sparkles, Star, Trash2 } from 'lucide-react';
import { posterUrl } from '@/lib/posterUrl';
import type { Movie } from '@/lib/types';
import { isUpcomingMovie } from '@/lib/movieAvailability';

export default function MovieCard({
  movie,
  onToggleWatched,
  onDeleteMovie,
  onRateMovie,
  onReactMovie,
  onSelectMovie,
  activeListName,
  onAddToList,
}: {
  movie: Movie;
  onToggleWatched: (movie: Movie) => void;
  onDeleteMovie?: (movie: Movie) => void;
  onRateMovie: (movie: Movie, rating: number | null) => void;
  onReactMovie: (movie: Movie, reaction: 'like' | 'dislike') => void;
  onSelectMovie: () => void;
  activeListName?: string | null;
  onAddToList?: (movie: Movie) => void;
}) {
  const poster = posterUrl(movie.poster_path, 'w500');
  const isUpcoming = isUpcomingMovie(movie);

  return (
    <div
      onClick={onSelectMovie}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelectMovie();
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`${movie.title} öffnen`}
      className={`group relative flex flex-col overflow-hidden rounded-xl border border-cinema-border bg-cinema-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-cinema-accent/60 hover:shadow-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:ring-offset-2 focus-visible:ring-offset-cinema-bg cursor-pointer ${
        movie.is_watched ? 'opacity-55 grayscale-[35%]' : ''
      }`}
    >
      <div className="relative aspect-[2/3] w-full bg-cinema-surface2">
        {poster ? (
          <Image
            src={poster}
            alt={movie.title}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 16vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-cinema-muted">
            <Clapperboard size={40} />
          </div>
        )}

        {movie.is_custom && (
          <div className="absolute left-2 top-2 flex items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-full bg-cinema-gold/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-black">
              <Sparkles size={10} /> eigene Wahl
            </span>
            {onDeleteMovie && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteMovie(movie);
                }}
                title="Film löschen"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600/90 text-white hover:bg-red-600 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        )}

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWatched(movie);
          }}
          title={isUpcoming
            ? 'Noch nicht erschienen'
            : movie.is_watched ? 'Als ungesehen markieren' : 'Als gesehen markieren'}
          aria-disabled={isUpcoming}
          className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
            movie.is_watched
              ? 'border-emerald-400 bg-emerald-500 text-white'
              : isUpcoming
                ? 'cursor-not-allowed border-white/30 bg-black/50 text-white/40'
                : 'border-white/70 bg-black/40 text-white/80 hover:border-emerald-400 hover:text-emerald-400'
          }`}
        >
          <Check size={16} strokeWidth={3} />
        </button>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/90 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div>
          <h4 className="line-clamp-2 font-semibold leading-tight text-white">{movie.title}</h4>
          <p className="flex flex-wrap items-center gap-2 text-xs text-cinema-muted">
            <span>{movie.release_year ?? '—'}</span>
            {movie.vote_average !== undefined && movie.vote_average > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-300">
                <Star size={11} fill="currentColor" /> {movie.vote_average.toFixed(1)}
              </span>
            )}
            {movie.director && <span>· {movie.director}</span>}
          </p>
        </div>

        {movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {movie.genres.slice(0, 3).map((g) => (
              <span
                key={g}
                className="rounded-full border border-cinema-border bg-cinema-surface2 px-2 py-0.5 text-[10px] text-cinema-muted"
              >
                {g}
              </span>
            ))}
          </div>
        )}

        <div className="rounded-lg border border-cinema-border bg-cinema-surface2/70 px-2.5 py-2" onClick={(e) => e.stopPropagation()}>
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-cinema-muted">
            <span>Deine Wertung</span>
            <span className="font-semibold text-amber-300">{movie.user_rating ? `${movie.user_rating}/10` : 'Noch offen'}</span>
          </div>
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 10 }, (_, index) => index + 1).map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onRateMovie(movie, movie.user_rating === rating ? null : rating);
                }}
                disabled={isUpcoming}
                aria-label={`${rating} von 10 für ${movie.title}`}
                className={`h-6 rounded text-[10px] font-semibold transition-all ${
                  isUpcoming
                    ? 'cursor-not-allowed bg-cinema-surface text-cinema-muted/50'
                    : movie.user_rating && rating <= movie.user_rating
                    ? 'bg-cinema-gold text-black shadow-[0_0_8px_rgba(245,158,11,0.55)]'
                    : 'bg-cinema-surface text-cinema-muted hover:bg-cinema-accent hover:text-white'
                }`}
              >
                {rating}
              </button>
            ))}
          </div>
          {movie.user_rating && !isUpcoming && (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onRateMovie(movie, null);
              }}
              className="mt-2 text-[11px] text-cinema-muted transition-colors hover:text-white"
            >
              Bewertung löschen
            </button>
          )}
          {!isUpcoming && (
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onReactMovie(movie, 'like'); }} className={`text-[11px] transition-colors ${movie.user_reaction === 'like' ? 'text-emerald-300' : 'text-cinema-muted hover:text-emerald-300'}`}>Gefällt mir</button>
              <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onReactMovie(movie, 'dislike'); }} className={`text-[11px] transition-colors ${movie.user_reaction === 'dislike' ? 'text-red-300' : 'text-cinema-muted hover:text-red-300'}`}>Nicht für mich</button>
            </div>
          )}
          {activeListName && onAddToList && (
            <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onAddToList(movie); }} className="mt-2 block text-[11px] text-cinema-accent transition-colors hover:text-white">
              Zur Liste „{activeListName}“
            </button>
          )}
        </div>

        <p className="line-clamp-3 text-xs leading-relaxed text-cinema-muted">
          {movie.overview || 'Keine Beschreibung verfügbar.'}
        </p>

        {movie.why && (
          <div className="rounded-lg border border-cinema-gold/20 bg-cinema-gold/5 px-2.5 py-2 text-[11px] leading-relaxed text-cinema-gold/90">
            <span className="font-semibold text-cinema-gold">Warum dieser Film?</span> {movie.why}
          </div>
        )}

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWatched(movie);
          }}
          className={`mt-auto flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors ${
            movie.is_watched
              ? 'bg-cinema-surface2 text-emerald-400'
              : isUpcoming
                ? 'bg-cinema-surface2 text-cinema-muted'
                : 'bg-cinema-accent/15 text-cinema-accent hover:bg-cinema-accent hover:text-white'
          }`}
        >
          <Check size={13} />
          {movie.is_watched ? 'Gesehen ✓' : isUpcoming ? 'Noch nicht erschienen' : 'Als gesehen markieren'}
        </button>
      </div>
    </div>
  );
}