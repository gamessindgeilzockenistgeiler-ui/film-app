'use client';

import { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import Image from 'next/image';
import { Sparkles, Loader2, Plus, Check, Wand2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { posterUrl } from '@/lib/posterUrl';
import type { AiRecommendation } from '@/lib/types';

const GENRES = [
  'Action', 'Komödie', 'Drama', 'Thriller', 'Sci-Fi', 'Horror',
  'Romantik', 'Mystery', 'Fantasy', 'Animation', 'Krimi', 'Abenteuer',
];

export default function AIAssistant({ session }: { session: Session | null }) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<AiRecommendation[]>([]);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  const handleAsk = async () => {
    if (!prompt.trim() && selectedGenres.length === 0) {
      setError('Beschreibe deine Stimmung oder wähle mindestens ein Genre aus.');
      return;
    }
    setError(null);
    setLoading(true);
    setRecommendations([]);
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, genres: selectedGenres }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRecommendations(data.recommendations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Etwas ist schiefgelaufen.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = async (rec: AiRecommendation) => {
    if (!session) {
      setError('Bitte melde dich an, um Filme zu deiner Liste hinzuzufügen.');
      return;
    }
    if (!rec.tmdb_id) return;

    const { error } = await supabase.from('user_movies').upsert(
      {
        user_id: session.user.id,
        tmdb_id: rec.tmdb_id,
        title: rec.title,
        release_year: rec.year,
        poster_path: rec.poster_path,
        overview: rec.reason,
        genres: [],
        director: null,
        is_watched: false,
        is_custom: true,
      },
      { onConflict: 'user_id,tmdb_id' }
    );

    if (error) {
      setError(error.message);
    } else {
      setAddedIds((prev) => new Set(prev).add(rec.tmdb_id!));
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cinema-border bg-cinema-surface p-6 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-cinema-gold/15 p-2">
            <Wand2 className="text-cinema-gold" size={20} />
          </div>
          <h3 className="font-display text-xl tracking-wide text-white">Movie AI Assistant</h3>
        </div>

        <p className="mb-4 text-sm text-cinema-muted">
          Wähle Genres und/oder beschreibe deine Stimmung — die KI schlägt dir 3 passende Filme vor.
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => toggleGenre(g)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedGenres.includes(g)
                  ? 'border-cinema-accent bg-cinema-accent text-white'
                  : 'border-cinema-border text-cinema-muted hover:border-cinema-accent hover:text-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='z. B. "Ich will einen Mindfuck-Film wie Inception" oder "Etwas Gemütliches für einen Regentag"'
          rows={3}
          className="mb-4 w-full resize-none rounded-lg border border-cinema-border bg-cinema-surface2 p-3 text-sm text-white placeholder:text-cinema-muted outline-none focus:border-cinema-accent"
        />

        {error && <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

        <button
          onClick={handleAsk}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cinema-accent to-cinema-gold px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          Filme vorschlagen lassen
        </button>
      </div>

      {recommendations.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((rec, i) => {
            const poster = posterUrl(rec.poster_path, 'w500');
            const isAdded = rec.tmdb_id ? addedIds.has(rec.tmdb_id) : false;
            return (
              <div
                key={i}
                className="flex flex-col overflow-hidden rounded-xl border border-cinema-border bg-cinema-surface shadow-card animate-fade-in"
              >
                <div className="relative aspect-[2/3] w-full bg-cinema-surface2">
                  {poster ? (
                    <Image src={poster} alt={rec.title} fill className="object-cover" sizes="33vw" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-cinema-muted">
                      <Sparkles size={32} />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h4 className="font-semibold text-white">
                    {rec.title} {rec.year && <span className="text-cinema-muted">({rec.year})</span>}
                  </h4>
                  <p className="flex-1 text-sm leading-relaxed text-cinema-muted">{rec.reason}</p>
                  <button
                    onClick={() => handleAddToList(rec)}
                    disabled={isAdded || !rec.tmdb_id}
                    className={`mt-2 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors ${
                      isAdded
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-cinema-accent/15 text-cinema-accent hover:bg-cinema-accent hover:text-white'
                    }`}
                  >
                    {isAdded ? <Check size={13} /> : <Plus size={13} />}
                    {isAdded ? 'Auf deiner Liste' : 'Direkt auf meine Liste setzen'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
