
create table if not exists public.user_movies (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  tmdb_id      integer not null,
  title        text not null,
  release_date date,
  release_year integer,
  poster_path  text,
  overview     text,
  genres       text[] default '{}',
  director     text,
  vote_average numeric not null default 0,
  vote_count   integer not null default 0,
  is_watched   boolean not null default false,
  is_custom    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- Pro User darf jeder Film (TMDB-ID) nur einmal vorkommen
  unique (user_id, tmdb_id)
);

-- Migration für bestehende Installationen: ergänzt die TMDB-Metadaten,
-- auch wenn user_movies bereits vorher angelegt wurde.
alter table public.user_movies add column if not exists release_date date;
alter table public.user_movies add column if not exists vote_average numeric not null default 0;
alter table public.user_movies add column if not exists vote_count integer not null default 0;

create index if not exists idx_user_movies_user_id on public.user_movies (user_id);

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
-- Community-Kommentare zu Filmen inklusive Antworten
-- ============================================================
create table if not exists public.movie_comments (
  id          uuid primary key default gen_random_uuid(),
  tmdb_id     integer not null,
  user_id     uuid not null references auth.users(id) on delete cascade,
  user_name   text not null,
  content     text not null check (char_length(trim(content)) > 0),
  parent_id   uuid references public.movie_comments(id) on delete cascade,
  likes       integer not null default 0 check (likes >= 0),
  dislikes    integer not null default 0 check (dislikes >= 0),
  created_at  timestamptz not null default now()
);

create index if not exists idx_movie_comments_movie_id on public.movie_comments (tmdb_id);
create index if not exists idx_movie_comments_parent_id on public.movie_comments (parent_id);

alter table public.movie_comments enable row level security;

drop policy if exists "Anyone can view movie comments" on public.movie_comments;
create policy "Anyone can view movie comments"
  on public.movie_comments for select
  using (true);

drop policy if exists "Users can insert movie comments" on public.movie_comments;
create policy "Users can insert movie comments"
  on public.movie_comments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can increment comment reactions" on public.movie_comments;
create policy "Users can increment comment reactions"
  on public.movie_comments for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ============================================================
-- Optional, aber empfohlen: E-Mail-Bestätigung deaktivieren,
-- damit sich Test-User sofort anmelden können, ohne eine Mail
-- zu bestätigen. Das machst du NICHT per SQL, sondern unter:
-- Supabase Dashboard -> Authentication -> Providers -> Email
-- -> "Confirm email" ausschalten (nur für Entwicklung empfohlen).
-- ============================================================
