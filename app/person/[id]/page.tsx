import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, UserRound } from 'lucide-react';
import { getPersonDetails } from '@/lib/tmdb';

interface PersonPageProps {
  params: { id: string };
}

async function loadPerson(id: string) {
  const personId = Number.parseInt(id, 10);
  if (!Number.isInteger(personId)) return null;
  return getPersonDetails(personId);
}

export async function generateMetadata({ params }: PersonPageProps): Promise<Metadata> {
  const person = await loadPerson(params.id);
  return { title: person ? `${person.name} | CineGrid` : 'Schauspieler nicht gefunden | CineGrid' };
}

export default async function PersonPage({ params }: PersonPageProps) {
  const person = await loadPerson(params.id);
  if (!person) {
    return <main className="flex min-h-screen items-center justify-center bg-cinema-bg text-white"><p>Schauspieler nicht gefunden.</p></main>;
  }

  const filmography = [...(person.combined_credits?.cast ?? []), ...(person.combined_credits?.crew ?? [])]
    .filter((credit) => credit.media_type === 'movie' && credit.title)
    .filter((credit, index, credits) => credits.findIndex((item) => item.id === credit.id) === index)
    .sort((a, b) => (b.release_date ?? '').localeCompare(a.release_date ?? ''))
    .slice(0, 48);

  return (
    <main className="min-h-screen bg-cinema-bg px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-cinema-muted hover:text-white"><ArrowLeft size={16} /> CineGrid</Link>
        <header className="grid gap-6 border-b border-cinema-border/70 pb-8 sm:grid-cols-[160px_1fr]">
          <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-cinema-surface2">
            {person.profile_path ? <Image src={`https://image.tmdb.org/t/p/w342${person.profile_path}`} alt={person.name} fill priority className="object-cover" sizes="160px" /> : <div className="flex h-full items-center justify-center text-cinema-muted"><UserRound size={42} /></div>}
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cinema-accent">CineGrid Personenprofil</p>
            <h1 className="mt-2 font-display text-5xl tracking-wide">{person.name}</h1>
            {person.biography && <p className="mt-5 max-w-3xl whitespace-pre-line leading-relaxed text-cinema-muted">{person.biography}</p>}
          </div>
        </header>
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Filme von {person.name}</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {filmography.map((credit) => (
              <Link key={credit.id} href={`/movie/${credit.id}`} className="group">
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-cinema-surface2">
                  {credit.poster_path && <Image src={`https://image.tmdb.org/t/p/w342${credit.poster_path}`} alt={credit.title!} fill className="object-cover transition-transform group-hover:scale-105" sizes="(max-width: 640px) 45vw, 150px" />}
                </div>
                <p className="mt-2 line-clamp-2 text-xs font-medium">{credit.title}</p>
                {credit.character && <p className="mt-1 line-clamp-1 text-[11px] text-cinema-muted">spielt {credit.character}</p>}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}