import { NextResponse } from 'next/server';
import { getMovieRatingSummary } from '@/lib/movieRatings';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const tmdbId = Number.parseInt(params.id, 10);
  if (!Number.isInteger(tmdbId)) {
    return NextResponse.json({ error: 'Ungültige TMDB-ID.' }, { status: 400 });
  }

  return NextResponse.json(await getMovieRatingSummary(tmdbId));
}