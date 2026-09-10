'use client';

import { Film, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

export default function Header({
  session,
  onOpenAuth,
}: {
  session: Session | null;
  onOpenAuth: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-cinema-border/70 glass">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-cinema-accent/15 p-1.5">
            <Film className="text-cinema-accent" size={22} />
          </div>
          <h1 className="font-display text-2xl tracking-widest text-white">
            CINE<span className="text-cinema-accent">TRACK</span>
          </h1>
        </div>

        {session ? (
          <div className="flex items-center gap-3">
            <Link href={`/profile/${session.user.id}`} className="hidden items-center gap-2 rounded-full border border-cinema-border bg-cinema-surface px-3 py-1.5 text-sm text-cinema-muted transition-colors hover:text-white sm:flex">
              <User size={14} />
              {session.user.email}
            </Link>
            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-1.5 rounded-full border border-cinema-border px-3 py-1.5 text-sm text-cinema-muted transition-colors hover:border-cinema-accent hover:text-white"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Abmelden</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="rounded-full bg-cinema-accent px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-105 active:scale-95"
          >
            Anmelden
          </button>
        )}
      </div>
    </header>
  );
}
