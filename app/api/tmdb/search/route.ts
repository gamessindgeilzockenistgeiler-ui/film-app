import { NextRequest, NextResponse } from 'next/server';
import { searchMovies, extractYear } from '@/lib/tmdb';
import type { TmdbSearchResult } from '@/lib/types';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const raw = await searchMovies(q, 8);
    const results: TmdbSearchResult[] = raw
      .filter((m) => m.poster_path)
      .map((m) => ({
        tmdb_id: m.id,
        title: m.title,
        release_year: extractYear(m.release_date),
        poster_path: m.poster_path,
        overview: m.overview,
      }));
    return NextResponse.json({ results });
  } catch (err) {
    console.error('TMDB Suchfehler:', err);
    return NextResponse.json({ results: [], error: 'Suche fehlgeschlagen.' }, { status: 500 });
  }
}
