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
  vote_average?: number;
  vote_count?: number;
  genres: { id: number; name: string }[];
  credits?: {
    crew: { id: number; job: string; department: string; name: string; profile_path: string | null }[];
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
  };
  'watch/providers'?: {
    results?: {
      DE?: {
        link?: string;
        flatrate?: TmdbProvider[];
        rent?: TmdbProvider[];
        buy?: TmdbProvider[];
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
  images?: {
    backdrops?: { file_path: string; width: number; height: number }[];
    posters?: { file_path: string; width: number; height: number }[];
  };
  similar?: { results?: TmdbMovieRecommendation[] };
  recommendations?: { results?: TmdbMovieRecommendation[] };
  reviews?: {
    results?: { id: string; author: string; content: string; created_at: string; url: string }[];
  };
}

export interface TmdbProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority?: number;
}

export interface TmdbMovieRecommendation {
  id: number;
  title: string;
  release_date?: string;
  poster_path: string | null;
  vote_average?: number;
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
  // Alle öffentlich verfügbaren Detaildaten in einem gecachten TMDB-Request laden.
  const res = await fetch(
    `${TMDB_BASE}/movie/${id}?append_to_response=credits,watch/providers,videos,images,similar,recommendations,reviews&language=de-DE`,
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