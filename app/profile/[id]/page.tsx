'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, Star, UserRound } from 'lucide-react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface Profile {
  id: string;
  username: string;
  bio: string | null;
  favorite_genres: string[] | null;
  is_private: boolean;
}

interface PublicMovie {
  tmdb_id: number;
  title: string;
  release_year: number | null;
  poster_path: string | null;
  user_rating: number | null;
  is_watched: boolean;
}

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [movies, setMovies] = useState<PublicMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      const { data, error: profileError } = await supabase.from('profiles').select('id,username,bio,favorite_genres,is_private').eq('id', params.id).maybeSingle();
      if (profileError) {
        setError('Profil konnte nicht geladen werden.');
        setLoading(false);
        return;
      }
      if (!data || data.is_private) {
        setLoading(false);
        return;
      }

      setProfile(data as Profile);
      const { data: movieData, error: movieError } = await supabase
        .from('user_movies')
        .select('tmdb_id,title,release_year,poster_path,user_rating,is_watched')
        .eq('user_id', params.id)
        .order('title');
      if (movieError) setError('Die öffentliche Filmliste konnte nicht geladen werden.');
      setMovies((movieData as PublicMovie[]) ?? []);
      setLoading(false);
    }
    loadProfile();
  }, [params.id]);

  return (
    <main className="min-h-screen bg-cinema-bg px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-cinema-muted hover:text-white"><ArrowLeft size={16} /> Zurück zu CineGrid</Link>
        {loading ? <p className="text-cinema-muted">Profil wird geladen...</p> : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center text-sm text-red-300">{error}</div>
        ) : !profile ? (
          <div className="rounded-2xl border border-cinema-border bg-cinema-surface p-8 text-center">
            <Lock className="mx-auto mb-3 text-cinema-muted" />
            <h1 className="text-xl font-semibold">Profil nicht verfügbar</h1>
            <p className="mt-2 text-sm text-cinema-muted">Dieses Profil ist privat oder existiert nicht.</p>
          </div>
        ) : (
          <>
            <section className="rounded-2xl border border-cinema-border bg-cinema-surface p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cinema-accent/20 text-cinema-accent"><UserRound size={28} /></div>
                <div>
                  <h1 className="font-display text-3xl">{profile.username}</h1>
                  <p className="mt-2 max-w-2xl text-sm text-cinema-muted">{profile.bio || 'Noch keine Bio hinterlegt.'}</p>
                  {profile.favorite_genres && profile.favorite_genres.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{profile.favorite_genres.map((genre) => <span key={genre} className="rounded-full border border-cinema-border bg-cinema-surface2 px-3 py-1 text-xs text-cinema-muted">{genre}</span>)}</div>}
                </div>
              </div>
            </section>
            <section className="mt-6">
              <h2 className="mb-4 text-lg font-semibold">Öffentliche Filmliste</h2>
              {movies.length === 0 ? <p className="text-sm text-cinema-muted">Noch keine Filme öffentlich gespeichert.</p> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{movies.map((movie) => <article key={movie.tmdb_id} className="rounded-xl border border-cinema-border bg-cinema-surface p-4"><h3 className="font-semibold">{movie.title}</h3><p className="mt-1 text-xs text-cinema-muted">{movie.release_year ?? '—'} {movie.is_watched ? '· Gesehen' : '· Watchlist'}</p>{movie.user_rating && <p className="mt-3 inline-flex items-center gap-1 text-sm text-amber-300"><Star size={14} fill="currentColor" /> {movie.user_rating}/10</p>}</article>)}</div>}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
