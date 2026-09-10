import { NextRequest, NextResponse } from 'next/server';
import { getMovieDetails, extractDirector, extractYear } from '@/lib/tmdb';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const tmdbId = parseInt(params.id, 10);
  if (isNaN(tmdbId)) {
    return NextResponse.json({ error: 'Ungültige TMDB-ID.' }, { status: 400 });
  }

  const details = await getMovieDetails(tmdbId);
  if (!details) {
    return NextResponse.json({ error: 'Film nicht gefunden.' }, { status: 404 });
  }

  // Cast (Schauspieler mit Bildern) extrahieren
  const cast = details.credits?.cast?.map((c: any) => ({
    id: c.id,
    name: c.name,
    character: c.character,
    profile_path: c.profile_path,
  })) ?? [];

  // Streaming-Anbieter (für Deutschland DE) extrahieren
  const providers = details['watch/providers']?.results?.DE?.flatrate?.map((p: any) => ({
    provider_id: p.provider_id,
    provider_name: p.provider_name,
    logo_path: p.logo_path,
  })) ?? [];

  // YouTube-Trailer oder Teaser raussuchen
  const trailer = details.videos?.results?.find(
    (video) => video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
  );

  const movie = {
    tmdb_id: details.id,
    title: details.title,
    release_year: extractYear(details.release_date),
    poster_path: details.poster_path,
    overview: details.overview,
    genres: details.genres?.map((g: any) => g.name) ?? [],
    director: extractDirector(details),
    is_watched: false,
    is_custom: true,
    cast,
    providers,
    trailer_key: trailer?.key ?? null, // Da ist das gute Stück!
  };

  return NextResponse.json({ movie });
}