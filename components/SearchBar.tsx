'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, Plus, Loader2, X } from 'lucide-react';
import Image from 'next/image';
import { posterUrl } from '@/lib/posterUrl';
import type { TmdbSearchResult } from '@/lib/types';

export default function SearchBar({
  onAddMovie,
  disabled,
}: {
  onAddMovie: (tmdbId: number) => Promise<void>;
  disabled: boolean;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAdd = async (id: number) => {
    setAddingId(id);
    try {
      await onAddMovie(id);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center gap-2.5 rounded-xl border border-cinema-border bg-cinema-surface px-4 py-3 shadow-card focus-within:border-cinema-accent transition-colors">
        <Search size={18} className="shrink-0 text-cinema-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          disabled={disabled}
          placeholder={disabled ? 'Melde dich an, um Filme hinzuzufügen…' : 'Film suchen & zur Liste hinzufügen…'}
          className="w-full bg-transparent text-sm text-white placeholder:text-cinema-muted outline-none disabled:cursor-not-allowed"
        />
        {loading && <Loader2 size={16} className="animate-spin text-cinema-muted" />}
        {query && (
          <button onClick={() => setQuery('')} className="text-cinema-muted hover:text-white">
            <X size={16} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-30 mt-2 max-h-96 w-full overflow-y-auto rounded-xl border border-cinema-border bg-cinema-surface shadow-2xl animate-fade-in">
          {results.map((r) => {
            const poster = posterUrl(r.poster_path, 'w342');
            return (
              <div
                key={r.tmdb_id}
                className="flex items-center gap-3 border-b border-cinema-border/60 p-3 last:border-none hover:bg-cinema-surface2"
              >
                <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md bg-cinema-surface2">
                  {poster && <Image src={poster} alt={r.title} fill className="object-cover" sizes="44px" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{r.title}</p>
                  <p className="text-xs text-cinema-muted">{r.release_year ?? '—'}</p>
                </div>
                <button
                  onClick={() => handleAdd(r.tmdb_id)}
                  disabled={addingId === r.tmdb_id}
                  className="flex shrink-0 items-center gap-1 rounded-full bg-cinema-accent/15 px-3 py-1.5 text-xs font-medium text-cinema-accent transition-colors hover:bg-cinema-accent hover:text-white disabled:opacity-60"
                >
                  {addingId === r.tmdb_id ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  Hinzufügen
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
