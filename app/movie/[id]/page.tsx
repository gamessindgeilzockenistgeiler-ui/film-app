import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Clapperboard, Star } from 'lucide-react';
import { extractDirector, getMovieDetails } from '@/lib/tmdb';
import { posterUrl } from '@/lib/posterUrl';

interface MoviePageProps {
  params: { id: string };
}

async function loadMovie(id: string) {
  const tmdbId = Number.parseInt(id, 10);
  if (!Number.isInteger(tmdbId)) return null;
  return getMovieDetails(tmdbId);
}

export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  const movie = await loadMovie(params.id);
  if (!movie) return { title: 'Film nicht gefunden | CineGrid' };

  return {
    title: `${movie.title} | CineGrid`,
    description: movie.overview || `Entdecke ${movie.title} auf CineGrid.`,
    openGraph: {
      title: `${movie.title} | CineGrid`,
      description: movie.overview || `Entdecke ${movie.title} auf CineGrid.`,
      type: 'article',
      images: movie.poster_path ? [posterUrl(movie.poster_path, 'w780')!] : undefined,
    },
  };
}

export default async function MoviePage({ params }: MoviePageProps) {
  const movie = await loadMovie(params.id);

  if (!movie) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cinema-bg px-4 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Film nicht gefunden</h1>
          <Link href="/" className="mt-4 inline-flex text-sm text-cinema-accent hover:underline">
            Zurück zu CineGrid
          </Link>
        </div>
      </main>
    );
  }

  const poster = posterUrl(movie.poster_path, 'w780');
  const releaseDate = movie.release_date
    ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'long' }).format(new Date(`${movie.release_date}T00:00:00`))
    : 'Unbekannt';

  return (
    <main className="min-h-screen bg-cinema-bg px-4 py-8 text-white sm:px-6 lg:px-8">
      <article className="mx-auto max-w-5xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-cinema-muted hover:text-white">
          <ArrowLeft size={16} /> Zurück zu CineGrid
        </Link>
        <div className="grid gap-8 md:grid-cols-[280px_1fr]">
          <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-cinema-surface2">
            {poster ? (
              <Image src={poster} alt={movie.title} fill priority className="object-cover" sizes="280px" />
            ) : (
              <div className="flex h-full items-center justify-center text-cinema-muted"><Clapperboard size={48} /></div>
            )}
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cinema-accent">CineGrid Filmguide</p>
            <h1 className="mt-2 font-display text-5xl tracking-wide">{movie.title}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-3 text-sm text-cinema-muted">
              <span>Kinostart: {releaseDate}</span>
              {movie.vote_average ? <span className="inline-flex items-center gap-1 text-amber-300"><Star size={14} fill="currentColor" /> {movie.vote_average.toFixed(1)}/10</span> : null}
              {extractDirector(movie) ? <span>Regie: {extractDirector(movie)}</span> : null}
            </p>
            <p className="mt-8 max-w-2xl leading-relaxed text-cinema-muted">{movie.overview || 'Keine Beschreibung verfügbar.'}</p>
            {movie.genres.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {movie.genres.map((genre) => <span key={genre.id} className="rounded-full border border-cinema-border bg-cinema-surface px-3 py-1 text-xs text-cinema-muted">{genre.name}</span>)}
              </div>
            )}
          </div>
        </div>
      </article>
    </main>
  );
}