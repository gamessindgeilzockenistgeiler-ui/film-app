import { NextResponse } from 'next/server';
import { CLASSICS, getClassicReason } from '@/lib/classics';
import { searchMovie, getMovieDetails, extractDirector, extractYear } from '@/lib/tmdb';
import type { Movie } from '@/lib/types';

export const revalidate = 3600; // 1h Cache, damit geänderte Kinostarts zeitnah ankommen

export async function GET() {
  try {
    const results = await Promise.all(
      CLASSICS.map(async (seed): Promise<Movie | null> => {
        const found = await searchMovie(seed.title, seed.year);
        if (!found) return null;
        const details = await getMovieDetails(found.id);
        if (!details) return null;

        return {
          tmdb_id: details.id,
          title: details.title,
          release_date: details.release_date,
          release_year: extractYear(details.release_date),
          poster_path: details.poster_path,
          overview: details.overview,
          why: getClassicReason(seed.title, seed.year),
          vote_average: details.vote_average ?? 0,
          vote_count: details.vote_count ?? 0,
          genres: details.genres?.map((g) => g.name) ?? [],
          director: extractDirector(details),
          is_watched: false,
          is_custom: false,
        };
      })
    );

    const movies = results.filter((m): m is Movie => m !== null);
    return NextResponse.json({ movies });
  } catch (err) {
    console.error('Fehler beim Laden der Klassiker:', err);
    return NextResponse.json({ movies: [], error: 'Klassiker konnten nicht geladen werden.' }, { status: 500 });
  }
}
