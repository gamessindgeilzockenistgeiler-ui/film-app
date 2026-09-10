import { NextRequest, NextResponse } from 'next/server';
import { getMovieDetails, extractDirector, extractYear } from '@/lib/tmdb';
import type { Movie } from '@/lib/types';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const tmdbId = parseInt(params.id, 10);
  if (isNaN(tmdbId)) {
    return NextResponse.json({ error: 'Ungültige TMDB-ID.' }, { status: 400 });
  }

  const details = await getMovieDetails(tmdbId);
  if (!details) {
    return NextResponse.json({ error: 'Film nicht gefunden.' }, { status: 404 });
  }

  const movie: Movie = {
    tmdb_id: details.id,
    title: details.title,
    release_year: extractYear(details.release_date),
    poster_path: details.poster_path,
    overview: details.overview,
    genres: details.genres?.map((g) => g.name) ?? [],
    director: extractDirector(details),
    is_watched: false,
    is_custom: true,
  };

  return NextResponse.json({ movie });
}
