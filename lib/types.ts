export interface Movie {
  tmdb_id: number;
  title: string;
  release_year: number | null;
  poster_path: string | null;
  overview: string;
  genres: string[];
  director: string | null;
  is_watched: boolean;
  is_custom: boolean;
}

export interface TmdbSearchResult {
  tmdb_id: number;
  title: string;
  release_year: number | null;
  poster_path: string | null;
  overview: string;
}

export interface AiRecommendation {
  title: string;
  year: number | null;
  reason: string;
  tmdb_id: number | null;
  poster_path: string | null;
}
