import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Clapperboard, Lock } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { getMovieDetails } from '@/lib/tmdb';
import { posterUrl } from '@/lib/posterUrl';

interface ListPageProps {
  params: { id: string };
}

const publicSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

async function loadList(id: string) {
  const { data: list } = await publicSupabase
    .from('movie_lists')
    .select('id,name,description,is_public')
    .eq('id', id)
    .maybeSingle();
  if (!list?.is_public) return null;

  const { data: items } = await publicSupabase
    .from('movie_list_items')
    .select('tmdb_id')
    .eq('list_id', id);
  const movies = await Promise.all((items ?? []).map((item) => getMovieDetails(item.tmdb_id)));
  return { list, movies: movies.filter((movie): movie is NonNullable<typeof movie> => movie !== null) };
}

export async function generateMetadata({ params }: ListPageProps): Promise<Metadata> {
  const result = await loadList(params.id);
  return { title: result ? `${result.list.name} | CineGrid` : 'Liste nicht verfügbar | CineGrid' };
}

export default async function SharedListPage({ params }: ListPageProps) {
  const result = await loadList(params.id);
  if (!result) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cinema-bg px-4 text-white">
        <div className="text-center">
          <Lock className="mx-auto mb-3 text-cinema-muted" />
          <h1 className="text-xl font-semibold">Liste nicht öffentlich</h1>
          <Link href="/" className="mt-4 inline-block text-sm text-cinema-accent hover:text-white">CineGrid</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cinema-bg px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-cinema-muted hover:text-white"><ArrowLeft size={16} /> CineGrid</Link>
        <header className="border-b border-cinema-border/70 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cinema-accent">Geteilte Filmliste</p>
          <h1 className="mt-2 font-display text-5xl tracking-wide">{result.list.name}</h1>
          {result.list.description && <p className="mt-3 max-w-2xl text-sm text-cinema-muted">{result.list.description}</p>}
        </header>
        {result.movies.length === 0 ? (
          <p className="mt-8 text-sm text-cinema-muted">Diese Liste enthält noch keine Filme.</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {result.movies.map((movie) => {
              const poster = posterUrl(movie.poster_path, 'w342');
              return (
                <Link key={movie.id} href={`/movie/${movie.id}`} className="group">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-cinema-surface2">
                    {poster ? <Image src={poster} alt={movie.title} fill className="object-cover transition-transform group-hover:scale-105" sizes="(max-width: 640px) 45vw, 150px" /> : <div className="flex h-full items-center justify-center text-cinema-muted"><Clapperboard size={24} /></div>}
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs font-medium text-white">{movie.title}</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
