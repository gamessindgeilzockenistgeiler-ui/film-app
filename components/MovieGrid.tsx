'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Download, Loader2, ListFilter } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import ProgressBar from './ProgressBar';
import SearchBar from './SearchBar';
import MovieCard from './MovieCard';
import type { Movie } from '@/lib/types';
import { isUpcomingMovie } from '@/lib/movieAvailability';
import MovieStats from './MovieStats';
import MovieLists, { type MovieListOption } from './MovieLists';
import MovieAchievements from './MovieAchievements';
import MoviePicks from './MoviePicks';
import MovieQuiz from './MovieQuiz';
import UpcomingCalendar from './UpcomingCalendar';

type Filter = 'all' | 'watched' | 'watchlist' | 'upcoming';
type Sort = 'title' | 'rating' | 'release';
const guestMoviesStorageKey = 'cinegrid_guest_movies';
const guestListsStorageKey = 'cinegrid_guest_lists';
const guestListItemsStorageKey = 'cinegrid_guest_list_items';
const guestReactionsStorageKey = 'cinegrid_guest_reactions';

interface UserMovieRow {
  user_id?: string;
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
  const router = useRouter();
  const [classics, setClassics] = useState<Movie[]>([]);
  const [userRows, setUserRows] = useState<UserMovieRow[]>([]);
  const [guestRows, setGuestRows] = useState<UserMovieRow[]>([]);
  const [lists, setLists] = useState<MovieListOption[]>([]);
  const [listItems, setListItems] = useState<Record<string, number[]>>({});
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [targetListId, setTargetListId] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, 'like' | 'dislike'>>({});
  const [loadingClassics, setLoadingClassics] = useState(true);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('title');
  const [decade, setDecade] = useState('all');
  const [genre, setGenre] = useState('all');
  const [minimumRating, setMinimumRating] = useState('0');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [, setClock] = useState(() => Date.now());

  useEffect(() => {
    const refreshClock = window.setInterval(() => setClock(Date.now()), 60 * 1000);
    return () => window.clearInterval(refreshClock);
  }, []);

  useEffect(() => {
    if (session) return;
    try {
      const storedLists = window.localStorage.getItem(guestListsStorageKey);
      const storedItems = window.localStorage.getItem(guestListItemsStorageKey);
      if (storedLists) setLists(JSON.parse(storedLists) as MovieListOption[]);
      if (storedItems) setListItems(JSON.parse(storedItems) as Record<string, number[]>);
      const storedReactions = window.localStorage.getItem(guestReactionsStorageKey);
      if (storedReactions) setReactions(JSON.parse(storedReactions) as Record<string, 'like' | 'dislike'>);
    } catch {
      setLists([]);
      setListItems({});
      setReactions({});
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    Promise.all([
      supabase.from('movie_lists').select('id,name,is_public').eq('user_id', session.user.id).order('created_at'),
      supabase.from('movie_list_items').select('list_id,tmdb_id'),
    ]).then(([listResult, itemResult]) => {
      if (!listResult.error) setLists((listResult.data ?? []) as MovieListOption[]);
      if (!itemResult.error) {
        const grouped = (itemResult.data ?? []).reduce<Record<string, number[]>>((result, item) => {
          result[item.list_id] = [...(result[item.list_id] ?? []), item.tmdb_id];
          return result;
        }, {});
        setListItems(grouped);
      }
    });
  }, [session]);

  useEffect(() => {
    try {
      const storedMovies = window.localStorage.getItem(guestMoviesStorageKey);
      if (storedMovies) setGuestRows(JSON.parse(storedMovies) as UserMovieRow[]);
    } catch {
      setGuestRows([]);
    }
  }, []);

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
      const reactionResult = await supabase.from('movie_reactions').select('tmdb_id,reaction').eq('user_id', session.user.id);
      if (!reactionResult.error) {
        setReactions(Object.fromEntries((reactionResult.data ?? []).map((row) => [String(row.tmdb_id), row.reaction as 'like' | 'dislike'])));
      }
      const rows = (data as UserMovieRow[]) ?? [];
      const rowsMissingReleaseDate = rows.filter((row) => row.is_custom && !row.release_date);
      const releaseDates = await Promise.all(
        rowsMissingReleaseDate.map(async (row) => {
          try {
            const response = await fetch(`/api/tmdb/movie/${row.tmdb_id}`);
            const result = await response.json();
            return result.movie?.release_date
              ? { tmdb_id: row.tmdb_id, release_date: result.movie.release_date, release_year: result.movie.release_year }
              : null;
          } catch {
            return null;
          }
        })
      );
      const releaseDateByMovieId = new Map(
        releaseDates.filter((release) => release !== null).map((release) => [release.tmdb_id, release])
      );

      setUserRows(rows.map((row) => {
        const release = releaseDateByMovieId.get(row.tmdb_id);
        const hydratedRow = release
          ? { ...row, release_date: release.release_date, release_year: release.release_year }
          : row;
        return isUpcomingMovie(hydratedRow)
          ? { ...hydratedRow, user_rating: null, is_watched: false }
          : hydratedRow;
      }));
    }
    setLoadingUserData(false);
  };

  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  // 3) Klassiker + persönlichen Status zusammenführen; eigene Filme anhängen
  const mergedMovies: Movie[] = useMemo(() => {
    const allRows = [...guestRows, ...userRows];
    const rowByTmdbId = new Map(allRows.map((r) => [r.tmdb_id, r]));

    const mergedClassics = classics.map((c) => {
      const row = rowByTmdbId.get(c.tmdb_id);
      return row ? { ...c, is_watched: row.is_watched, user_rating: row.user_rating, user_reaction: reactions[String(c.tmdb_id)] ?? null } : { ...c, user_reaction: reactions[String(c.tmdb_id)] ?? null };
    });

    const customMovies: Movie[] = allRows
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
        user_reaction: reactions[String(r.tmdb_id)] ?? null,
        is_watched: r.is_watched,
        is_custom: true,
      }));

    return [...customMovies, ...mergedClassics];
  }, [classics, guestRows, reactions, userRows]);

  const watchedCount = mergedMovies.filter((m) => m.is_watched).length;

  const visibleMovies = useMemo(() => {
    const filtered = mergedMovies.filter((movie) => {
      if (filter === 'watched') return movie.is_watched;
      if (filter === 'watchlist') return !movie.is_watched;
      if (filter === 'upcoming') return isUpcomingMovie(movie);
      return true;
    }).filter((movie) => {
      const listMatches = activeListId === null || (listItems[activeListId] ?? []).includes(movie.tmdb_id);
      const yearMatches = decade === 'all' || (movie.release_year !== null && Math.floor(movie.release_year / 10) * 10 === Number(decade));
      const genreMatches = genre === 'all' || movie.genres.includes(genre);
      const ratingMatches = (movie.vote_average ?? 0) >= Number(minimumRating);
      return listMatches && yearMatches && genreMatches && ratingMatches;
    });

    return [...filtered].sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title, 'de', { sensitivity: 'base' });
      if (sort === 'rating') return (b.vote_average ?? 0) - (a.vote_average ?? 0);
      return (b.release_date ?? `${b.release_year ?? 0}-01-01`).localeCompare(a.release_date ?? `${a.release_year ?? 0}-01-01`);
    });
  }, [activeListId, decade, filter, genre, listItems, mergedMovies, minimumRating, sort]);

  const targetListName = lists.find((list) => list.id === targetListId)?.name ?? null;

  async function createList(name: string) {
    if (session) {
      const { data, error } = await supabase.from('movie_lists').insert({ user_id: session.user.id, name }).select('id,name').single();
      if (error) setErrorMsg(error.message);
      else if (data) setLists((current) => [...current, data as MovieListOption]);
      return;
    }
    const list = { id: `guest-${Date.now()}`, name };
    const next = [...lists, list];
    setLists(next);
    window.localStorage.setItem(guestListsStorageKey, JSON.stringify(next));
  }

  async function deleteList(id: string) {
    if (session) {
      const { error } = await supabase.from('movie_lists').delete().eq('id', id).eq('user_id', session.user.id);
      if (error) { setErrorMsg(error.message); return; }
    }
    const next = lists.filter((list) => list.id !== id);
    const nextItems = { ...listItems };
    delete nextItems[id];
    setLists(next);
    setListItems(nextItems);
    setActiveListId(activeListId === id ? null : activeListId);
    if (!session) {
      window.localStorage.setItem(guestListsStorageKey, JSON.stringify(next));
      window.localStorage.setItem(guestListItemsStorageKey, JSON.stringify(nextItems));
    }
  }

  async function addToList(movie: Movie) {
    if (!activeListId) return;
    if (session) {
      const { error } = await supabase.from('movie_list_items').upsert({ list_id: activeListId, tmdb_id: movie.tmdb_id });
      if (error) { setErrorMsg(error.message); return; }
    }
    const nextItems = { ...listItems, [activeListId]: [...new Set([...(listItems[activeListId] ?? []), movie.tmdb_id])] };
    setListItems(nextItems);
    if (!session) window.localStorage.setItem(guestListItemsStorageKey, JSON.stringify(nextItems));
  }

  async function toggleListPublic(id: string, isPublic: boolean) {
    if (session) {
      const { error } = await supabase.from('movie_lists').update({ is_public: isPublic }).eq('id', id).eq('user_id', session.user.id);
      if (error) { setErrorMsg(error.message); return; }
    }
    setLists((current) => current.map((list) => list.id === id ? { ...list, is_public: isPublic } : list));
    if (isPublic) {
      await navigator.clipboard?.writeText(`${window.location.origin}/lists/${id}`);
      setErrorMsg('Liste geteilt: Der Link wurde kopiert.');
    }
  }

  const decades = [...new Set(mergedMovies.map((movie) => movie.release_year ? Math.floor(movie.release_year / 10) * 10 : null).filter((value): value is number => value !== null))].sort((a, b) => b - a);
  const genres = [...new Set(mergedMovies.flatMap((movie) => movie.genres))].sort((a, b) => a.localeCompare(b, 'de'));

  function exportVisibleMovies() {
    const header = ['Titel', 'Erscheinungsjahr', 'Kinostart', 'TMDB-Bewertung', 'Deine Bewertung', 'Gesehen'];
    const rows = visibleMovies.map((movie) => [
      movie.title,
      movie.release_year ?? '',
      movie.release_date ?? '',
      movie.vote_average ?? '',
      movie.user_rating ?? '',
      movie.is_watched ? 'Ja' : 'Nein',
    ]);
    const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cinegrid-filme.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

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

    if (!session) {
      const guestRow: UserMovieRow = {
        ...payload,
        user_id: 'guest',
        release_date: payload.release_date,
        overview: payload.overview,
        genres: payload.genres,
        vote_average: payload.vote_average,
        vote_count: payload.vote_count,
        user_rating: payload.user_rating,
        is_watched: payload.is_watched,
        is_custom: payload.is_custom,
      };
      setGuestRows((current) => {
        const next = current.some((row) => row.tmdb_id === guestRow.tmdb_id)
          ? current.map((row) => row.tmdb_id === guestRow.tmdb_id ? guestRow : row)
          : [...current, guestRow];
        window.localStorage.setItem(guestMoviesStorageKey, JSON.stringify(next));
        return next;
      });
      return { error: null };
    }

    const candidatePayload: Record<string, unknown> = { ...payload };
    let result = await supabase.from('user_movies').upsert(candidatePayload, { onConflict: 'user_id,tmdb_id' });

    for (let attempt = 0; result.error && attempt < 4; attempt += 1) {
      const missingColumn = result.error.message.match(/Could not find the ['"]([^'"]+)['"] column/i)?.[1]
        ?? result.error.message.match(/(?:column|field) ['"]?([a-z_]+)['"]?/i)?.[1];
      const knownColumns = ['release_date', 'vote_average', 'vote_count'];
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
    const nextWatched = !movie.is_watched;

    const updateRows = (prev: UserMovieRow[]) => {
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
    };
    if (session) setUserRows(updateRows);
    else setGuestRows(updateRows);

      const { error } = await persistMovie(movie, nextWatched, movie.is_custom);

    if (error) {
      setErrorMsg(error.message);
      loadUserData();
    }
  };

  const handleRateMovie = async (movie: Movie, rating: number | null) => {
    if (isUpcomingMovie(movie) && rating !== null) {
      setErrorMsg('Dieser Film ist noch nicht erschienen und kann noch nicht bewertet werden.');
      return;
    }
    const ratedMovie = { ...movie, user_rating: rating };
    const updateRows = (current: UserMovieRow[]) => {
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
    };
    if (session) setUserRows(updateRows);
    else setGuestRows(updateRows);

    const { error } = await persistMovie(ratedMovie, movie.is_watched, movie.is_custom);

    if (error) {
      setErrorMsg(error.message);
      loadUserData();
    }
  };

  const handleReactMovie = async (movie: Movie, reaction: 'like' | 'dislike') => {
    if (isUpcomingMovie(movie)) return;
    const key = String(movie.tmdb_id);
    const nextReaction = reactions[key] === reaction ? null : reaction;
    setReactions((current) => {
      const next = { ...current };
      if (nextReaction) next[key] = nextReaction;
      else delete next[key];
      if (!session) window.localStorage.setItem(guestReactionsStorageKey, JSON.stringify(next));
      return next;
    });

    if (session) {
      const result = nextReaction
        ? await supabase.from('movie_reactions').upsert({ user_id: session.user.id, tmdb_id: movie.tmdb_id, reaction: nextReaction })
        : await supabase.from('movie_reactions').delete().eq('user_id', session.user.id).eq('tmdb_id', movie.tmdb_id);
      if (result.error) setErrorMsg(result.error.message);
    }
  };

  // 5) Eigenen Film über die Suche hinzufügen
  const handleAddMovie = async (tmdbId: number) => {
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
    } else if (session) {
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
      <SearchBar onAddMovie={handleAddMovie} disabled={false} />

      <MovieStats movies={mergedMovies} />

      <MovieAchievements movies={mergedMovies} />

      <MoviePicks movies={mergedMovies} />

      <MovieQuiz />

      <UpcomingCalendar movies={mergedMovies} />

      <MovieLists lists={lists} activeListId={activeListId} targetListId={targetListId} onSelect={setActiveListId} onTarget={setTargetListId} onCreate={createList} onDelete={deleteList} onTogglePublic={toggleListPublic} />

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
        <div className="flex flex-wrap items-center gap-2">
          <select value={decade} onChange={(event) => setDecade(event.target.value)} aria-label="Nach Jahrzehnt filtern" className="rounded-lg border border-cinema-border bg-cinema-surface2 px-2.5 py-2 text-xs text-white outline-none focus:border-cinema-accent">
            <option value="all">Alle Jahrzehnte</option>
            {decades.map((value) => <option key={value} value={value}>{value}er</option>)}
          </select>
          <select value={genre} onChange={(event) => setGenre(event.target.value)} aria-label="Nach Genre filtern" className="max-w-40 rounded-lg border border-cinema-border bg-cinema-surface2 px-2.5 py-2 text-xs text-white outline-none focus:border-cinema-accent">
            <option value="all">Alle Genres</option>
            {genres.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select value={minimumRating} onChange={(event) => setMinimumRating(event.target.value)} aria-label="Mindestbewertung wählen" className="rounded-lg border border-cinema-border bg-cinema-surface2 px-2.5 py-2 text-xs text-white outline-none focus:border-cinema-accent">
            <option value="0">Jede Bewertung</option>
            {[5, 6, 7, 8, 9].map((value) => <option key={value} value={value}>Ab {value}/10</option>)}
          </select>
          <button type="button" onClick={exportVisibleMovies} title="Sichtbare Filme als CSV exportieren" className="inline-flex items-center gap-1.5 rounded-lg border border-cinema-border px-2.5 py-2 text-xs text-cinema-muted transition-colors hover:border-cinema-accent hover:text-white">
            <Download size={14} /> CSV
          </button>
        </div>
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
              onReactMovie={handleReactMovie}
              onSelectMovie={() => router.push(`/movie/${movie.tmdb_id}`)}
              activeListName={targetListName}
              onAddToList={addToList}
            />
          ))}
        </div>
      )}
    </div>
  );
}