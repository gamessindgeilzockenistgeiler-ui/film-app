import 'server-only';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export interface MovieRatingSummary {
  average_rating: number;
  rating_count: number;
}

export async function getMovieRatingSummary(tmdbId: number): Promise<MovieRatingSummary> {
  const { data, error } = await supabase.rpc('get_movie_rating_summary', { p_tmdb_id: tmdbId });
  if (error) return { average_rating: 0, rating_count: 0 };
  const row = Array.isArray(data) ? data[0] : data;
  return {
    average_rating: Number(row?.average_rating ?? 0),
    rating_count: Number(row?.rating_count ?? 0),
  };
}