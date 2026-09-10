'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, UserRound, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface Profile {
  username: string;
  bio: string;
  favorite_genres: string[];
  is_private: boolean;
}

export default function ProfileSetupModal({
  userId,
  onClose,
  required = false,
}: {
  userId: string;
  onClose: () => void;
  required?: boolean;
}) {
  const [profile, setProfile] = useState<Profile>({ username: '', bio: '', favorite_genres: [], is_private: false });
  const [genresText, setGenresText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      const { data } = await supabase.from('profiles').select('username,bio,favorite_genres,is_private').eq('id', userId).maybeSingle();
      if (data) {
        const nextProfile = {
          username: data.username ?? '',
          bio: data.bio ?? '',
          favorite_genres: data.favorite_genres ?? [],
          is_private: data.is_private ?? false,
        };
        setProfile(nextProfile);
        setGenresText(nextProfile.favorite_genres.join(', '));
      }
      setLoading(false);
    }
    loadProfile();
  }, [userId]);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!profile.username.trim()) {
      setError('Bitte gib einen Benutzernamen ein.');
      return;
    }

    setSaving(true);
    setError('');
    const favoriteGenres = genresText.split(',').map((genre) => genre.trim()).filter(Boolean).slice(0, 10);
    const { error: saveError } = await supabase.from('profiles').upsert({
      id: userId,
      username: profile.username.trim(),
      bio: profile.bio.trim(),
      favorite_genres: favoriteGenres,
      is_private: profile.is_private,
      updated_at: new Date().toISOString(),
    });

    if (saveError) setError(saveError.message);
    else onClose();
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-cinema-border bg-cinema-surface p-6 text-white shadow-glow">
        {!required && (
          <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-1.5 text-cinema-muted hover:bg-cinema-surface2 hover:text-white" aria-label="Profil schließen">
            <X size={18} />
          </button>
        )}
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-cinema-accent/15 p-2 text-cinema-accent"><UserRound size={22} /></div>
          <div>
            <h2 className="font-display text-2xl">Dein Filmprofil</h2>
            <p className="text-xs text-cinema-muted">Richte dein öffentliches Profil ein.</p>
          </div>
        </div>

        {loading ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-cinema-accent" /></div> : (
          <form onSubmit={saveProfile} className="space-y-4">
            <label className="block text-xs font-medium text-cinema-muted">Benutzername
              <input required value={profile.username} onChange={(event) => setProfile({ ...profile, username: event.target.value })} maxLength={40} className="mt-1.5 w-full rounded-lg border border-cinema-border bg-cinema-surface2 px-3 py-2.5 text-sm text-white outline-none focus:border-cinema-accent" placeholder="z. B. cinephile_42" />
            </label>
            <label className="block text-xs font-medium text-cinema-muted">Bio
              <textarea value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} maxLength={280} rows={3} className="mt-1.5 w-full resize-none rounded-lg border border-cinema-border bg-cinema-surface2 px-3 py-2.5 text-sm text-white outline-none focus:border-cinema-accent" placeholder="Welche Filme liebst du?" />
            </label>
            <label className="block text-xs font-medium text-cinema-muted">Lieblingsgenres <span className="font-normal">(kommagetrennt)</span>
              <input value={genresText} onChange={(event) => setGenresText(event.target.value)} className="mt-1.5 w-full rounded-lg border border-cinema-border bg-cinema-surface2 px-3 py-2.5 text-sm text-white outline-none focus:border-cinema-accent" placeholder="Sci-Fi, Thriller, Drama" />
            </label>
            <label className="flex items-center gap-2 text-sm text-cinema-muted">
              <input type="checkbox" checked={profile.is_private} onChange={(event) => setProfile({ ...profile, is_private: event.target.checked })} className="accent-red-600" />
              Profil privat halten
            </label>
            {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
            <button type="submit" disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-lg bg-cinema-accent py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Profil speichern
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
