'use client';

import { Trophy } from 'lucide-react';

export default function ProgressBar({ watched, total }: { watched: number; total: number }) {
  const pct = total > 0 ? Math.round((watched / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-cinema-border bg-cinema-surface p-5 shadow-card sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Trophy className="text-cinema-gold" size={20} />
          <h3 className="font-display text-xl tracking-wide text-white">Must-Watch-Fortschritt</h3>
        </div>
        <span className="font-display text-2xl text-cinema-gold">
          {watched} / {total} <span className="text-base text-cinema-muted">— {pct}% geschafft!</span>
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-cinema-surface2">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cinema-accent to-cinema-gold transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
