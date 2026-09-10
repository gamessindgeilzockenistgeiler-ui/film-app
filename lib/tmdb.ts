import 'server-only';

// Server-seitige TMDB-Helper. Wird ausschließlich in app/api/**/route.ts importiert,
// damit der Read-Access-Token niemals an den Client gelangt.
// Die 'server-only'-Markierung lässt den Build fehlschlagen, falls dieses
// Modul versehentlich aus einer 'use client'-Komponente importiert wird.

const TMDB_BASE = 'https://api.themoviedb.org/3';

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.TMDB_READ_ACCESS_TOKEN}`,
    Accept: 'application/json',
  };
}

export { posterUrl } from './posterUrl';

export interface TmdbMovieSummary {
  id: number;
  title: string;
  release_date?: string;
  poster_path: string | null;
  overview: string;
  genre_ids?: number[];
}

export interface TmdbMovieFull {
  id: number;
  title: string;
  release_date?: string;
  poster_path: string | null;
  overview: string;
  genres: { id: number; name: string }[];
  credits?: {
    crew: { job: string; name: string }[];
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
  };
  'watch/providers'?: {
    results?: {
      DE?: {
        flatrate?: { provider_id: number; provider_name: string; logo_path: string }[];
      };
    };
  };
  videos?: {
    results?: {
      site: string;
      type: string;
      key: string;
    }[];
  };
}

export async function searchMovie(query: string, year?: number): Promise<TmdbMovieSummary | null> {
  const params = new URLSearchParams({ query, include_adult: 'false', language: 'de-DE' });
  if (year) params.set('year', String(year));
  const res = await fetch(`${TMDB_BASE}/search/movie?${params.toString()}`, {
    headers: authHeaders(),
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.results?.[0] ?? null;
}

export async function searchMovies(query: string, limit = 10): Promise<TmdbMovieSummary[]> {
  const params = new URLSearchParams({ query, include_adult: 'false', language: 'de-DE' });
  const res = await fetch(`${TMDB_BASE}/search/movie?${params.toString()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results ?? []).slice(0, limit);
}

export async function getMovieDetails(id: number): Promise<TmdbMovieFull | null> {
  // credits, watch/providers und videos direkt zusammen abfragen
  const res = await fetch(
    `${TMDB_BASE}/movie/${id}?append_to_response=credits,watch/providers,videos&language=de-DE`,
    {
      headers: authHeaders(),
      next: { revalidate: 60 * 60 * 24 },
    }
  );
  if (!res.ok) return null;
  return res.json();
}

export function extractDirector(details: TmdbMovieFull): string | null {
  const director = details.credits?.crew.find((c) => c.job === 'Director');
  return director?.name ?? null;
}

export function extractYear(dateStr?: string): number | null {
  if (!dateStr) return null;
  const year = parseInt(dateStr.slice(0, 4), 10);
  return isNaN(year) ? null : year;
}