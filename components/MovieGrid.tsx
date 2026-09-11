'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Loader2, ListFilter } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import ProgressBar from './ProgressBar';
import SearchBar from './SearchBar';
import MovieCard from './MovieCard';
import type { Movie } from '@/lib/types';
import MovieDetailModal from './MovieDetailModal';
import { isUpcomingMovie } from '@/lib/movieAvailability';

type Filter = 'all' | 'watched' | 'watchlist' | 'upcoming';
type Sort = 'title' | 'rating' | 'release';

interface UserMovieRow {
  tmdb_id: number;
  title: string;
  release_date: string | null;
  release_year: number | null;
  poster_path: string | null;
  overview: string | null;
  genres: string[] | null;
  director: string | null;
  vote_average: number | null;
  vote_count: number | null;
  user_rating: number | null;
  is_watched: boolean;
  is_custom: boolean;
}

export default function MovieGrid({ session }: { session: Session | null }) {
  const [classics, setClassics] = useState<Movie[]>([]);
  const [userRows, setUserRows] = useState<UserMovieRow[]>([]);
  const [loadingClassics, setLoadingClassics] = useState(true);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('title');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  // 1) Klassiker-Liste laden (einmalig, unabhängig vom Login-Status)
  useEffect(() => {
    fetch('/api/classics')
      .then((r) => r.json())
      .then((data) => setClassics(data.movies ?? []))
      .catch(() => setErrorMsg('Klassiker konnten nicht geladen werden.'))
      .finally(() => setLoadingClassics(false));
  }, []);

  // 2) Persönlichen Status aus Supabase laden, sobald eingeloggt
  const loadUserData = async () => {
    if (!session) {
      setUserRows([]);
      setLoadingUserData(false);
      return;
    }
    setLoadingUserData(true);
    const { data, error } = await supabase
      .from('user_movies')
      .select('*')
      .eq('user_id', session.user.id);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setUserRows((data as UserMovieRow[]) ?? []);
    }
    setLoadingUserData(false);
  };

  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  // 3) Klassiker + persönlichen Watched-Status zusammenführen; eigene Filme anhängen
  const mergedMovies: Movie[] = useMemo(() => {
    const rowByTmdbId = new Map(userRows.map((r) => [r.tmdb_id, r]));

    const mergedClassics = classics.map((c) => {
      const row = rowByTmdbId.get(c.tmdb_id);
      return row ? { ...c, is_watched: row.is_watched, user_rating: row.user_rating } : c;
    });

    const customMovies: Movie[] = userRows
      .filter((r) => r.is_custom)
      .map((r) => ({
        tmdb_id: r.tmdb_id,
        title: r.title,
        release_date: r.release_date ?? undefined,
        release_year: r.release_year,
        poster_path: r.poster_path,
        overview: r.overview ?? '',
        genres: r.genres ?? [],
        director: r.director,
        vote_average: r.vote_average ?? 0,
        vote_count: r.vote_count ?? 0,
        user_rating: r.user_rating,
        is_watched: r.is_watched,
        is_custom: true,
      }));

    return [...customMovies, ...mergedClassics];
  }, [classics, userRows]);

  const watchedCount = mergedMovies.filter((m) => m.is_watched).length;

  const visibleMovies = useMemo(() => {
    const filtered = mergedMovies.filter((movie) => {
      if (filter === 'watched') return movie.is_watched;
      if (filter === 'watchlist') return !movie.is_watched;
      if (filter === 'upcoming') return isUpcomingMovie(movie);
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title, 'de', { sensitivity: 'base' });
      if (sort === 'rating') return (b.vote_average ?? 0) - (a.vote_average ?? 0);
      return (b.release_date ?? `${b.release_year ?? 0}-01-01`).localeCompare(a.release_date ?? `${a.release_year ?? 0}-01-01`);
    });
  }, [filter, mergedMovies, sort]);

  const persistMovie = async (movie: Movie, isWatched: boolean, isCustom: boolean) => {
    const payload = {
      user_id: session?.user.id,
      tmdb_id: movie.tmdb_id,
      title: movie.title,
      release_date: movie.release_date ?? null,
      release_year: movie.release_year,
      poster_path: movie.poster_path,
      overview: movie.overview,
      genres: movie.genres,
      director: movie.director,
      vote_average: movie.vote_average ?? 0,
      vote_count: movie.vote_count ?? 0,
      user_rating: movie.user_rating ?? null,
      is_watched: isWatched,
      is_custom: isCustom,
    };

    const candidatePayload: Record<string, unknown> = { ...payload };
    let result = await supabase.from('user_movies').upsert(candidatePayload, { onConflict: 'user_id,tmdb_id' });

    for (let attempt = 0; result.error && attempt < 4; attempt += 1) {
      const missingColumn = result.error.message.match(/Could not find the ['"]([^'"]+)['"] column/i)?.[1]
        ?? result.error.message.match(/(?:column|field) ['"]?([a-z_]+)['"]?/i)?.[1];
      const knownColumns = ['release_date', 'vote_average', 'vote_count', 'user_rating'];
      const schemaCacheError = result.error.code === 'PGRST204' || result.error.message.includes('schema cache');

      if (!schemaCacheError || !missingColumn || !knownColumns.includes(missingColumn)) break;
      delete candidatePayload[missingColumn];
      result = await supabase.from('user_movies').upsert(candidatePayload, { onConflict: 'user_id,tmdb_id' });
    }

    return result;
  };

  // 4) "Gesehen" umschalten -> Upsert in Supabase
  const handleToggleWatched = async (movie: Movie) => {
    if (isUpcomingMovie(movie)) {
      setErrorMsg('Dieser Film ist noch nicht erschienen und kann noch nicht als gesehen markiert werden.');
      return;
    }
    if (!session) {
      setErrorMsg('Bitte melde dich an, um Filme als gesehen zu markieren.');
      return;
    }
    const nextWatched = !movie.is_watched;

    setUserRows((prev) => {
      const exists = prev.find((r) => r.tmdb_id === movie.tmdb_id);
      if (exists) {
        return prev.map((r) => (r.tmdb_id === movie.tmdb_id ? { ...r, is_watched: nextWatched } : r));
      }
      return [
        ...prev,
        {
          tmdb_id: movie.tmdb_id,
          title: movie.title,
          release_date: movie.release_date ?? null,
          release_year: movie.release_year,
          poster_path: movie.poster_path,
          overview: movie.overview,
          genres: movie.genres,
          director: movie.director,
          vote_average: movie.vote_average ?? 0,
          vote_count: movie.vote_count ?? 0,
          user_rating: movie.user_rating ?? null,
          is_watched: nextWatched,
          is_custom: movie.is_custom,
        },
      ];
    });

      const { error } = await persistMovie(movie, nextWatched, movie.is_custom);

    if (error) {
      setErrorMsg(error.message);
      loadUserData();
    }
  };

  const handleRateMovie = async (movie: Movie, rating: number) => {
    if (isUpcomingMovie(movie)) {
      setErrorMsg('Dieser Film ist noch nicht erschienen und kann noch nicht bewertet werden.');
      return;
    }
    if (!session) {
      setErrorMsg('Bitte melde dich an, um Filme zu bewerten.');
      return;
    }

    const ratedMovie = { ...movie, user_rating: rating };
    setUserRows((current) => {
      const exists = current.some((row) => row.tmdb_id === movie.tmdb_id);
      if (exists) return current.map((row) => (row.tmdb_id === movie.tmdb_id ? { ...row, user_rating: rating } : row));
      return [...current, {
        tmdb_id: movie.tmdb_id,
        title: movie.title,
        release_date: movie.release_date ?? null,
        release_year: movie.release_year,
        poster_path: movie.poster_path,
        overview: movie.overview,
        genres: movie.genres,
        director: movie.director,
        vote_average: movie.vote_average ?? 0,
        vote_count: movie.vote_count ?? 0,
        user_rating: rating,
        is_watched: movie.is_watched,
        is_custom: movie.is_custom,
      }];
    });

    const { error } = await persistMovie(ratedMovie, movie.is_watched, movie.is_custom);

    if (error) {
      setErrorMsg(error.message);
      loadUserData();
    }
  };

  // 5) Eigenen Film über die Suche hinzufügen
  const handleAddMovie = async (tmdbId: number) => {
    if (!session) {
      setErrorMsg('Bitte melde dich an, um Filme hinzuzufügen.');
      return;
    }
    const res = await fetch(`/api/tmdb/movie/${tmdbId}`);
    const data = await res.json();
    if (!data.movie) {
      setErrorMsg('Film konnte nicht geladen werden.');
      return;
    }
    const movie: Movie = data.movie;

      const { error } = await persistMovie(movie, false, true);

    if (error) {
      setErrorMsg(error.message);
    } else {
      await loadUserData();
    }
  };

  // 6) Eigenen Film aus Supabase löschen
  const handleDeleteMovie = async (movie: Movie) => {
    if (!session) return;

    setUserRows((prev) => prev.filter((r) => r.tmdb_id !== movie.tmdb_id));

    const { error } = await supabase
      .from('user_movies')
      .delete()
      .eq('user_id', session.user.id)
      .eq('tmdb_id', movie.tmdb_id);

    if (error) {
      setErrorMsg(error.message);
      loadUserData();
    }
  };

  return (
    <div className="space-y-6">
      <SearchBar onAddMovie={handleAddMovie} disabled={!session} />

      <ProgressBar watched={watchedCount} total={mergedMovies.length} />

      {errorMsg && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-cinema-border bg-cinema-surface p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm">
        <ListFilter size={15} className="text-cinema-muted" />
        {(['all', 'watched', 'watchlist', 'upcoming'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 transition-colors ${
              filter === f
                ? 'bg-cinema-accent text-white'
                : 'bg-cinema-surface text-cinema-muted hover:text-white'
            }`}
          >
            {f === 'all' ? 'Alle Filme' : f === 'watched' ? 'Bereits gesehen' : f === 'watchlist' ? 'Watchlist' : 'Demnächst im Kino'}
          </button>
        ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-cinema-muted">
          Sortieren nach
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
            className="rounded-lg border border-cinema-border bg-cinema-surface2 px-2.5 py-2 text-xs text-white outline-none focus:border-cinema-accent"
          >
            <option value="title">Titel (A-Z)</option>
            <option value="rating">TMDB-Bewertung</option>
            <option value="release">Neueste zuerst</option>
          </select>
        </label>
      </div>

      {loadingClassics || loadingUserData ? (
        <div className="flex items-center justify-center gap-2 py-20 text-cinema-muted">
          <Loader2 className="animate-spin" size={20} />
          Filme werden geladen…
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {visibleMovies.map((movie) => (
            <MovieCard
              key={movie.tmdb_id}
              movie={movie}
              onToggleWatched={handleToggleWatched}
              onDeleteMovie={movie.is_custom ? handleDeleteMovie : undefined}
              onRateMovie={handleRateMovie}
              onSelectMovie={() => setSelectedMovie(movie)}
            />
          ))}
        </div>
      )}

      {/* Modal sauber am Ende platziert */}
      {selectedMovie && (
        <MovieDetailModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
      )}
    </div>
  );
}