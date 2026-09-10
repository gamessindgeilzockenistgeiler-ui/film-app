# 🎬 CineGrid — Cinematic Movie-Tracking Dashboard

Ein extrem stylisches, dunkles Film-Tracking-Dashboard (Next.js 14 App Router, Tailwind CSS, Lucide Icons, Supabase, TMDB, OpenAI).

## Features
- **Must-Watch-Klassiker**: 50 kuratierte Filme werden live über TMDB geladen (Original-Poster, Genres, Regisseur, Beschreibung).
- **Fortschrittsbalken**: zeigt live an, wie viele Klassiker du schon gesehen hast.
- **Auth**: E-Mail/Passwort-Login & Registrierung via Supabase.
- **Persistenz**: "Gesehen"-Status und eigene Filme werden pro User in Supabase gespeichert (mit Row Level Security).
- **Live-Suche**: Filme über TMDB suchen und mit einem Klick zur eigenen Liste hinzufügen.
- **Movie AI Assistant**: GPT-4o-mini schlägt basierend auf Genres/Stimmung 3 Filme mit Begründung vor — direkt zur Liste hinzufügbar.

## 1. Installation

```bash
npm install
```

## 2. Umgebungsvariablen

Die Datei `.env.local` ist bereits mit den bereitgestellten Keys vorausgefüllt:

```
TMDB_READ_ACCESS_TOKEN="…"
TMDB_API_KEY="…"
NEXT_PUBLIC_SUPABASE_URL="…"
NEXT_PUBLIC_SUPABASE_ANON_KEY="…"
OPENAI_API_KEY="…"
```

> ⚠️ **Sicherheitshinweis:** `.env.local` ist in `.gitignore` eingetragen und darf **nie** in ein Git-Repo committed werden.
> Der `OPENAI_API_KEY` wird ausschließlich serverseitig verwendet (`app/api/ai/recommend/route.ts`) — er landet nie im Browser.
> Da diese Keys hier im Klartext übermittelt wurden, solltest du sie nach dem ersten erfolgreichen Test in TMDB/OpenAI/Supabase **rotieren** (neu generieren), sobald das Projekt produktiv wird.

## 3. Supabase-Datenbank einrichten

1. Öffne dein Supabase-Projekt → **SQL Editor** → **New query**.
2. Kopiere den kompletten Inhalt von [`supabase/schema.sql`](./supabase/schema.sql) hinein.
3. Klicke **Run**. Das erstellt die Tabelle `user_movies` inkl. Row-Level-Security-Policies.
4. (Empfohlen für die lokale Entwicklung) Unter **Authentication → Providers → Email** kannst du "Confirm email" deaktivieren, damit neu registrierte Test-User sich sofort einloggen können.

## 4. Entwicklungsserver starten

```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000).

## Projektstruktur

```
movie-tracker/
├── app/
│   ├── api/
│   │   ├── classics/route.ts        # Lädt & reichert die 50 Klassiker via TMDB an
│   │   ├── tmdb/search/route.ts     # Live-Suche für die Suchleiste
│   │   ├── tmdb/movie/[id]/route.ts # Volle Details für "Hinzufügen"
│   │   └── ai/recommend/route.ts    # GPT-4o-mini Filmempfehlungen
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                     # Hauptseite (Auth, Tabs, Layout)
├── components/
│   ├── AuthModal.tsx
│   ├── Header.tsx
│   ├── ProgressBar.tsx
│   ├── MovieCard.tsx
│   ├── MovieGrid.tsx
│   ├── SearchBar.tsx
│   ├── AIAssistant.tsx
│   └── Tabs.tsx
├── lib/
│   ├── classics.ts                  # Die 50 kuratierten Filmtitel
│   ├── tmdb.ts                      # Server-seitige TMDB-Helper
│   ├── supabaseClient.ts            # Supabase Browser-Client
│   └── types.ts
├── supabase/
│   └── schema.sql                   # SQL für Tabelle + RLS
├── .env.local
└── package.json
```

## Wie die Daten zusammenspielen

- Die 50 Klassiker werden **nicht** in der Datenbank vorab gespeichert, sondern bei jedem Laden live über TMDB gesucht (mit 24h-Cache). Das garantiert immer aktuelle, korrekte Poster & Metadaten.
- Sobald ein User einen Klassiker abhakt oder einen eigenen Film hinzufügt, wird eine Zeile in `user_movies` angelegt/aktualisiert (`upsert` mit `unique(user_id, tmdb_id)`).
- Beim Rendern werden Klassiker (aus TMDB) und persönlicher Status (aus Supabase) im Frontend gemerged — eigene Filme (`is_custom = true`) werden zusätzlich vorne in der Liste angezeigt.
