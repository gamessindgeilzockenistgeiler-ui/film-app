import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Clapperboard, Play, Star } from 'lucide-react';
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

        <section className="mt-10 border-t border-cinema-border pt-8">
          <h2 className="text-xl font-semibold text-white">Handlung</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-cinema-muted">{movie.overview || 'Keine Beschreibung verfügbar.'}</p>
        </section>

        {movie.credits?.cast && movie.credits.cast.length > 0 && (
          <section className="mt-8 border-t border-cinema-border pt-8">
            <h2 className="text-xl font-semibold text-white">Besetzung</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {movie.credits.cast.slice(0, 12).map((actor) => (
                <div key={actor.id} className="rounded-xl border border-cinema-border bg-cinema-surface p-3 text-center">
                  <div className="relative mx-auto aspect-square w-20 overflow-hidden rounded-full bg-cinema-surface2">
                    {actor.profile_path && <Image src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`} alt={actor.name} fill className="object-cover" sizes="80px" />}
                  </div>
                  <p className="mt-2 line-clamp-1 text-xs font-semibold text-white">{actor.name}</p>
                  <p className="line-clamp-1 text-[11px] text-cinema-muted">{actor.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {movie.credits?.crew && movie.credits.crew.length > 0 && (
          <section className="mt-8 border-t border-cinema-border pt-8">
            <h2 className="text-xl font-semibold text-white">Crew</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {movie.credits.crew.filter((member, index, crew) => crew.findIndex((candidate) => candidate.id === member.id && candidate.job === member.job) === index).slice(0, 30).map((member) => (
                <div key={`${member.id}-${member.job}`} className="flex items-center justify-between gap-3 rounded-lg border border-cinema-border bg-cinema-surface p-3 text-sm">
                  <span className="font-medium text-white">{member.name}</span>
                  <span className="text-right text-xs text-cinema-muted">{member.job}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {movie['watch/providers']?.results?.DE && (
          <section className="mt-8 border-t border-cinema-border pt-8">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-white"><Play size={18} className="text-cinema-accent" /> Streaming &amp; Verfügbarkeit</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(['flatrate', 'rent', 'buy'] as const).flatMap((type) => (movie['watch/providers']?.results?.DE?.[type] ?? []).map((provider) => ({ ...provider, type }))).map((provider) => (
                <div key={`${provider.type}-${provider.provider_id}`} className="flex items-center gap-3 rounded-lg border border-cinema-border bg-cinema-surface p-3">
                  <img src={`https://image.tmdb.org/t/p/original${provider.logo_path}`} alt="" className="h-8 w-8 rounded-md object-cover" />
                  <div>
                    <p className="text-sm font-medium text-white">{provider.provider_name}</p>
                    <p className="text-xs text-cinema-muted">{provider.type === 'flatrate' ? 'Streamen' : provider.type === 'rent' ? 'Leihen' : 'Kaufen'}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {movie.images?.backdrops && movie.images.backdrops.length > 0 && (
          <section className="mt-8 border-t border-cinema-border pt-8">
            <h2 className="text-xl font-semibold text-white">Bildergalerie</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {movie.images.backdrops.slice(0, 8).map((image) => (
                <div key={image.file_path} className="relative aspect-video overflow-hidden rounded-xl bg-cinema-surface2">
                  <Image src={`https://image.tmdb.org/t/p/w780${image.file_path}`} alt={`Szene aus ${movie.title}`} fill className="object-cover" sizes="(max-width: 640px) 50vw, 25vw" />
                </div>
              ))}
            </div>
          </section>
        )}

        {movie.recommendations?.results && movie.recommendations.results.length > 0 && (
          <section className="mt-8 border-t border-cinema-border pt-8">
            <h2 className="text-xl font-semibold text-white">Ähnliche Filme</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {movie.recommendations.results.slice(0, 6).map((similar) => (
                <Link key={similar.id} href={`/movie/${similar.id}`} className="group">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-cinema-surface2">
                    {similar.poster_path && <Image src={`https://image.tmdb.org/t/p/w342${similar.poster_path}`} alt={similar.title} fill className="object-cover transition-transform group-hover:scale-105" sizes="(max-width: 640px) 45vw, 160px" />}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-medium text-white">{similar.title}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {movie.reviews?.results && movie.reviews.results.length > 0 && (
          <section className="mt-8 border-t border-cinema-border pt-8">
            <h2 className="text-xl font-semibold text-white">Reviews</h2>
            <div className="mt-4 space-y-4">
              {movie.reviews.results.slice(0, 5).map((review) => (
                <article key={review.id} className="rounded-xl border border-cinema-border bg-cinema-surface p-4">
                  <div className="flex items-center justify-between gap-3 text-sm"><strong>{review.author}</strong><time className="text-xs text-cinema-muted">{new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(review.created_at))}</time></div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-cinema-muted">{review.content}</p>
                  <a href={review.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-cinema-accent hover:text-white">Review vollständig lesen</a>
                </article>
              ))}
            </div>
          </section>
        )}
      </article>
    </main>
  );
}