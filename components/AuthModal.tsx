'use client';

import { useState } from 'react';
import { X, Film, Loader2, Mail, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo('Konto erstellt! Falls Bestätigung aktiviert ist, prüfe dein E-Mail-Postfach. Ansonsten bist du direkt angemeldet.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Etwas ist schiefgelaufen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-cinema-border bg-cinema-surface p-8 shadow-glow animate-scale-in">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-cinema-muted hover:bg-cinema-surface2 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="mb-6 flex items-center gap-2">
          <div className="rounded-lg bg-cinema-accent/15 p-2">
            <Film className="text-cinema-accent" size={22} />
          </div>
          <h2 className="font-display text-2xl tracking-wide">
            {mode === 'signin' ? 'Willkommen zurück' : 'Konto erstellen'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-cinema-muted">E-Mail</label>
            <div className="flex items-center gap-2 rounded-lg border border-cinema-border bg-cinema-surface2 px-3 py-2.5 focus-within:border-cinema-accent transition-colors">
              <Mail size={16} className="text-cinema-muted shrink-0" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="du@beispiel.de"
                className="w-full bg-transparent text-sm text-white placeholder:text-cinema-muted outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-cinema-muted">Passwort</label>
            <div className="flex items-center gap-2 rounded-lg border border-cinema-border bg-cinema-surface2 px-3 py-2.5 focus-within:border-cinema-accent transition-colors">
              <Lock size={16} className="text-cinema-muted shrink-0" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-sm text-white placeholder:text-cinema-muted outline-none"
              />
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
          {info && <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-cinema-accent py-2.5 font-medium text-white transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === 'signin' ? 'Anmelden' : 'Registrieren'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-cinema-muted">
          {mode === 'signin' ? 'Noch kein Konto?' : 'Schon registriert?'}{' '}
          <button
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError(null);
              setInfo(null);
            }}
            className="font-medium text-cinema-gold hover:underline"
          >
            {mode === 'signin' ? 'Jetzt registrieren' : 'Jetzt anmelden'}
          </button>
        </p>
      </div>
    </div>
  );
}
