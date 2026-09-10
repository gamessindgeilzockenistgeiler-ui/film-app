'use client';

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSafeSession, supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import AuthModal from '@/components/AuthModal';
import MovieGrid from '@/components/MovieGrid';
import ProfileSetupModal from '@/components/ProfileSetupModal';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [profileSetupOpen, setProfileSetupOpen] = useState(false);

  useEffect(() => {
    let active = true;

    getSafeSession().then((currentSession) => {
      if (!active) return;
      setSession(currentSession);
      setCheckedAuth(true);
      if (currentSession) checkProfile(currentSession.user.id);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) checkProfile(newSession.user.id);
      else setProfileSetupOpen(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function checkProfile(userId: string) {
    try {
      const { data, error } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
      if (error) {
        console.warn('Profilstatus konnte nicht geladen werden:', error.message);
        return;
      }
      setProfileSetupOpen(!data);
    } catch (error) {
      console.warn('Profilstatus ist vorübergehend nicht verfügbar:', error);
    }
  }

  return (
    <>
      <Header session={session} onOpenAuth={() => setAuthOpen(true)} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="font-display text-4xl tracking-wide text-white sm:text-5xl">
            Deine persönliche <span className="text-cinema-accent">Watchlist</span>
          </h2>
          <p className="mt-2 max-w-2xl text-cinema-muted">
            Hake Klassiker ab, füge eigene Filme hinzu und verwalte deine Sammlung ganz ohne Zores.
          </p>
        </div>

        {!session && checkedAuth && (
          <div className="mb-6 rounded-xl border border-cinema-gold/30 bg-cinema-gold/10 px-4 py-3 text-sm text-cinema-gold">
            Du bist nicht angemeldet — du kannst die Klassiker-Liste durchstöbern, aber melde dich an, um deinen
            Fortschritt und eigene Filme dauerhaft zu speichern.
          </div>
        )}

        {/* Direkt das Film-Grid ohne Tabs oder KI-Umwege */}
        <MovieGrid session={session} />
      </main>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      {session && profileSetupOpen && (
        <ProfileSetupModal userId={session.user.id} required onClose={() => setProfileSetupOpen(false)} />
      )}

      <footer className="mt-16 border-t border-cinema-border/70 py-8 text-center text-xs text-cinema-muted">
        CineGrid — Deine Filme. Deine Watchlist. Dein nächster Lieblingsfilm.
      </footer>
    </>
  );
}