
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
  user_rating  integer check (user_rating between 1 and 10),
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
alter table public.user_movies add column if not exists user_rating integer;

-- ============================================================
-- Öffentliche Nutzerprofile
-- ============================================================
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text not null unique,
  bio             text not null default '',
  favorite_genres text[] not null default '{}',
  is_private      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Public profiles are viewable" on public.profiles;
create policy "Public profiles are viewable"
  on public.profiles for select
  using (not is_private or auth.uid() = id);

drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

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

drop policy if exists "Public profiles can expose movies" on public.user_movies;
create policy "Public profiles can expose movies"
  on public.user_movies for select
  using (exists (
    select 1 from public.profiles
    where profiles.id = user_movies.user_id
      and (profiles.is_private = false or profiles.id = auth.uid())
  ));

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

alter table public.movie_comments add column if not exists user_name text;
alter table public.movie_comments add column if not exists content text;
alter table public.movie_comments add column if not exists parent_id uuid;
alter table public.movie_comments add column if not exists likes integer not null default 0;
alter table public.movie_comments add column if not exists dislikes integer not null default 0;

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

-- Pro User und Kommentar ist genau eine Reaktion erlaubt.
create table if not exists public.comment_reactions (
  comment_id uuid not null references public.movie_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null check (reaction in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

alter table public.comment_reactions add column if not exists reaction text;

alter table public.comment_reactions enable row level security;

drop policy if exists "Users can view comment reactions" on public.comment_reactions;
create policy "Users can view comment reactions"
  on public.comment_reactions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can manage own comment reactions" on public.comment_reactions;
create policy "Users can manage own comment reactions"
  on public.comment_reactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.toggle_comment_reaction(
  p_comment_id uuid,
  p_reaction text
)
returns table (reaction text, likes integer, dislikes integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_reaction text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select cr.reaction into current_reaction
  from public.comment_reactions cr
  where cr.comment_id = p_comment_id and cr.user_id = auth.uid();

  if current_reaction = p_reaction then
    delete from public.comment_reactions
    where comment_id = p_comment_id and user_id = auth.uid();
  else
    insert into public.comment_reactions (comment_id, user_id, reaction)
    values (p_comment_id, auth.uid(), p_reaction)
    on conflict (comment_id, user_id)
    do update set reaction = excluded.reaction;
  end if;

  update public.movie_comments mc
  set likes = (select count(*) from public.comment_reactions cr where cr.comment_id = mc.id and cr.reaction = 'like'),
      dislikes = (select count(*) from public.comment_reactions cr where cr.comment_id = mc.id and cr.reaction = 'dislike')
  where mc.id = p_comment_id;

  select cr.reaction into current_reaction
  from public.comment_reactions cr
  where cr.comment_id = p_comment_id and cr.user_id = auth.uid();

  return query
  select current_reaction,
    (select count(*)::integer from public.comment_reactions cr where cr.comment_id = p_comment_id and cr.reaction = 'like'),
    (select count(*)::integer from public.comment_reactions cr where cr.comment_id = p_comment_id and cr.reaction = 'dislike');
end;
$$;

revoke all on function public.toggle_comment_reaction(uuid, text) from public;
grant execute on function public.toggle_comment_reaction(uuid, text) to authenticated;

-- ============================================================
-- Optional, aber empfohlen: E-Mail-Bestätigung deaktivieren,
-- damit sich Test-User sofort anmelden können, ohne eine Mail
-- zu bestätigen. Das machst du NICHT per SQL, sondern unter:
-- Supabase Dashboard -> Authentication -> Providers -> Email
-- -> "Confirm email" ausschalten (nur für Entwicklung empfohlen).
-- ============================================================
