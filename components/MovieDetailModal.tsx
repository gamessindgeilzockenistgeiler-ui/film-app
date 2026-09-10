'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, Play, Award, Users, Clapperboard } from 'lucide-react';
import { posterUrl } from '@/lib/posterUrl';
import type { Movie } from '@/lib/types';

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface StreamingProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

interface MovieDetails extends Movie {
  cast?: CastMember[];
  providers?: StreamingProvider[];
}

export default function MovieDetailModal({
  movie,
  onClose,
}: {
  movie: Movie;
  onClose: () => void;
}) {
  const [details, setDetails] = useState<MovieDetails>(movie);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TMDB Details (Cast & Streaming) nachladen
    async function fetchDetails() {
      try {
        const res = await fetch(`/api/tmdb/movie/${movie.tmdb_id}`);
        const data = await res.json();
        if (data.movie) {
          setDetails({
            ...movie,
            ...data.movie,
            cast: data.movie.cast || [],
            providers: data.movie.providers || [],
          });
        }
      } catch (err) {
        console.error('Fehler beim Laden der Filmdetails:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [movie]);

  const poster = posterUrl(details.poster_path, 'w500');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-cinema-border bg-cinema-surface p-6 shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Schließen-Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-cinema-surface2 text-cinema-muted hover:bg-cinema-accent hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Poster */}
          <div className="relative aspect-[2/3] w-full sm:w-44 flex-shrink-0 rounded-xl overflow-hidden bg-cinema-surface2 shadow-md">
            {poster ? (
              <Image src={poster} alt={details.title} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-cinema-muted">
                <Clapperboard size={36} />
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="flex flex-col flex-1 gap-3">
            <div>
              <h3 className="text-2xl font-bold">{details.title}</h3>
              <p className="text-sm text-cinema-muted">
                {details.release_year ?? '—'}{details.director ? ` · Regie: ${details.director}` : ''}
              </p>
            </div>

            {/* Genres */}
            {details.genres && details.genres.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {details.genres.map((g) => (
                  <span key={g} className="rounded-full border border-cinema-border bg-cinema-surface2 px-2.5 py-0.5 text-[10px] text-cinema-muted">
                    {g}
                  </span>
                ))}
              </div>
            )}

            <p className="text-xs leading-relaxed text-cinema-muted">
              {details.overview || 'Keine Beschreibung verfügbar.'}
            </p>
          </div>
        </div>

        {/* Streaming Anbieter */}
        <div className="mt-6 border-t border-cinema-border pt-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-cinema-accent mb-3">
            <Play size={15} /> Wo streamen?
          </h4>
          {loading ? (
            <p className="text-xs text-cinema-muted">Lade Streaming-Anbieter...</p>
          ) : details.providers && details.providers.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {details.providers.map((p) => (
                <div key={p.provider_id} className="flex items-center gap-2 rounded-lg bg-cinema-surface2 px-3 py-1.5 border border-cinema-border">
                  {p.logo_path && (
                    <img
                      src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
                      alt={p.provider_name}
                      className="h-5 w-5 rounded-md object-cover"
                    />
                  )}
                  <span className="text-xs font-medium">{p.provider_name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-cinema-muted">Aktuell bei keinem Flatrate-Anbieter in DE verfügbar.</p>
          )}
        </div>

        {/* Schauspieler (Cast) */}
        <div className="mt-6 border-t border-cinema-border pt-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-cinema-accent mb-3">
            <Users size={15} /> Top-Besetzung
          </h4>
          {loading ? (
            <p className="text-xs text-cinema-muted">Lade Schauspieler...</p>
          ) : details.cast && details.cast.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {details.cast.slice(0, 5).map((actor) => (
                <div key={actor.id} className="flex flex-col items-center text-center rounded-xl bg-cinema-surface2 p-2 border border-cinema-border">
                  <div className="relative h-16 w-16 rounded-full overflow-hidden mb-1.5 bg-black/40">
                    {actor.profile_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                        alt={actor.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-cinema-muted">Kein Bild</div>
                    )}
                  </div>
                  <span className="text-xs font-semibold line-clamp-1">{actor.name}</span>
                  <span className="text-[10px] text-cinema-muted line-clamp-1">{actor.character}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-cinema-muted">Keine Cast-Informationen verfügbar.</p>
          )}
        </div>

      </div>
    </div>
  );
}