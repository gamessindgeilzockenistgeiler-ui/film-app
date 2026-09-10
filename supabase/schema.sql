-- ============================================================
-- CineTrack — Supabase Schema
-- Führe dieses Skript im Supabase SQL Editor aus
-- (Dashboard -> SQL Editor -> New query -> einfügen -> Run)
-- ============================================================

-- Tabelle für den persönlichen Film-Status jedes Users:
-- speichert sowohl den "gesehen"-Status der Klassiker als auch
-- komplett eigene, selbst hinzugefügte Filme (is_custom = true).
create table if not exists public.user_movies (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  tmdb_id      integer not null,
  title        text not null,
  release_year integer,
  poster_path  text,
  overview     text,
  genres       text[] default '{}',
  director     text,
  is_watched   boolean not null default false,
  is_custom    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- Pro User darf jeder Film (TMDB-ID) nur einmal vorkommen
  unique (user_id, tmdb_id)
);

-- Index für schnelle Abfragen pro User
create index if not exists idx_user_movies_user_id on public.user_movies (user_id);

-- updated_at automatisch aktualisieren
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_user_movies_updated_at on public.user_movies;
create trigger trg_user_movies_updated_at
  before update on public.user_movies
  for each row
  execute function public.set_updated_at();

-- ============================================================
-- Row Level Security: jeder User sieht & bearbeitet NUR seine
-- eigenen Zeilen. Das ist essenziell, da der ANON-Key im
-- Frontend öffentlich ist.
-- ============================================================
alter table public.user_movies enable row level security;

drop policy if exists "Users can view own movies" on public.user_movies;
create policy "Users can view own movies"
  on public.user_movies for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own movies" on public.user_movies;
create policy "Users can insert own movies"
  on public.user_movies for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own movies" on public.user_movies;
create policy "Users can update own movies"
  on public.user_movies for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own movies" on public.user_movies;
create policy "Users can delete own movies"
  on public.user_movies for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Optional, aber empfohlen: E-Mail-Bestätigung deaktivieren,
-- damit sich Test-User sofort anmelden können, ohne eine Mail
-- zu bestätigen. Das machst du NICHT per SQL, sondern unter:
-- Supabase Dashboard -> Authentication -> Providers -> Email
-- -> "Confirm email" ausschalten (nur für Entwicklung empfohlen).
-- ============================================================
