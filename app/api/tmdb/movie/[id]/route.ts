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

  const cast = details.credits?.cast?.map((c) => ({
    id: c.id,
    name: c.name,
    character: c.character,
    profile_path: c.profile_path,
  })) ?? [];

  const providerRegion = details['watch/providers']?.results?.DE;
  const providers = [
    ...(providerRegion?.flatrate ?? []).map((provider) => ({ ...provider, availability: 'stream' as const })),
    ...(providerRegion?.rent ?? []).map((provider) => ({ ...provider, availability: 'rent' as const })),
    ...(providerRegion?.buy ?? []).map((provider) => ({ ...provider, availability: 'buy' as const })),
  ];

  const trailer = details.videos?.results?.find(
    (video) => video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
  );

  const movie = {
    tmdb_id: details.id,
    title: details.title,
    release_date: details.release_date, // 👈 Exaktes Datum (z.B. "2026-12-19")
    release_year: extractYear(details.release_date),
    poster_path: details.poster_path,
    overview: details.overview,
    genres: details.genres?.map((g) => g.name) ?? [],
    director: extractDirector(details),
    vote_average: details.vote_average ?? 0, // 👈 TMDB Bewertung (z.B. 8.4)
    vote_count: details.vote_count ?? 0,     // 👈 Anzahl der Stimmen
    is_watched: false,
    is_custom: true,
    cast,
    crew: details.credits?.crew ?? [],
    providers,
    provider_link: providerRegion?.link ?? null,
    gallery: (details.images?.backdrops ?? []).slice(0, 8),
    similar: [...(details.recommendations?.results ?? []), ...(details.similar?.results ?? [])]
      .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index)
      .slice(0, 6),
    reviews: (details.reviews?.results ?? []).slice(0, 5),
    trailer_key: trailer?.key ?? null,
  };

  return NextResponse.json({ movie });
}