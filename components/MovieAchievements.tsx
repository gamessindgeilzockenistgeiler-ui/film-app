'use client';

import { Award, Check, Lock } from 'lucide-react';
import type { Movie } from '@/lib/types';

interface Achievement {
  title: string;
  description: string;
  unlocked: boolean;
}

export default function MovieAchievements({ movies }: { movies: Movie[] }) {
  const watched = movies.filter((movie) => movie.is_watched);
  const rated = movies.filter((movie) => movie.user_rating !== null && movie.user_rating !== undefined);
  const achievements: Achievement[] = [
    {
      title: 'Erster Abspann',
      description: 'Markiere deinen ersten Film als gesehen.',
      unlocked: watched.length >= 1,
    },
    {
      title: 'Klassiker-Sammler',
      description: 'Sieh 10 Filme aus deiner Must-Watch-Liste.',
      unlocked: watched.filter((movie) => !movie.is_custom).length >= 10,
    },
    {
      title: 'Filmabend-Profi',
      description: 'Sieh 25 Filme insgesamt.',
      unlocked: watched.length >= 25,
    },
    {
      title: 'Kritiker',
      description: 'Bewerte 10 Filme mit deiner eigenen Wertung.',
      unlocked: rated.length >= 10,
    },
  ];

  return (
    <section aria-label="Deine Abzeichen" className="rounded-xl border border-cinema-border bg-cinema-surface p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Award size={18} className="text-cinema-gold" />
        <h2 className="text-sm font-semibold text-white">Deine Abzeichen</h2>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {achievements.map((achievement) => (
          <div key={achievement.title} className={`rounded-lg border p-3 ${achievement.unlocked ? 'border-cinema-gold/40 bg-cinema-gold/10' : 'border-cinema-border bg-cinema-surface2/50 opacity-65'}`}>
            <div className="flex items-center justify-between gap-2">
              <span className={`text-xs font-semibold ${achievement.unlocked ? 'text-cinema-gold' : 'text-cinema-muted'}`}>{achievement.title}</span>
              {achievement.unlocked ? <Check size={14} className="text-cinema-gold" /> : <Lock size={13} className="text-cinema-muted" />}
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-cinema-muted">{achievement.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
