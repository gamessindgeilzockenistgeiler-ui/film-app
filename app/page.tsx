'use client';

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import AuthModal from '@/components/AuthModal';
import Tabs, { TabKey } from '@/components/Tabs';
import MovieGrid from '@/components/MovieGrid';
import AIAssistant from '@/components/AIAssistant';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>('list');
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckedAuth(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <>
      <Header session={session} onOpenAuth={() => setAuthOpen(true)} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="font-display text-4xl tracking-wide text-white sm:text-5xl">
            Deine persönliche <span className="text-cinema-accent">Watchlist</span>
          </h2>
          <p className="mt-2 max-w-2xl text-cinema-muted">
            Hake Klassiker ab, füge eigene Filme hinzu und lass dir von der KI neue Favoriten empfehlen.
          </p>
        </div>

        {!session && checkedAuth && (
          <div className="mb-6 rounded-xl border border-cinema-gold/30 bg-cinema-gold/10 px-4 py-3 text-sm text-cinema-gold">
            Du bist nicht angemeldet — du kannst die Klassiker-Liste durchstöbern, aber melde dich an, um deinen
            Fortschritt und eigene Filme dauerhaft zu speichern.
          </div>
        )}

        <div className="mb-6">
          <Tabs active={tab} onChange={setTab} />
        </div>

        {tab === 'list' ? <MovieGrid session={session} /> : <AIAssistant session={session} />}
      </main>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      <footer className="mt-16 border-t border-cinema-border/70 py-8 text-center text-xs text-cinema-muted">
        CineTrack — Filmdaten via TMDB · Empfehlungen via OpenAI · gebaut mit Next.js
      </footer>
    </>
  );
}
