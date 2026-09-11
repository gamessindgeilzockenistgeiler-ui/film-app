'use client';

import { ListPlus, Plus, Share2, X } from 'lucide-react';

export interface MovieListOption {
  id: string;
  name: string;
  is_public?: boolean;
}

export default function MovieLists({
  lists,
  activeListId,
  targetListId,
  onSelect,
  onTarget,
  onCreate,
  onDelete,
  onTogglePublic,
}: {
  lists: MovieListOption[];
  activeListId: string | null;
  targetListId: string | null;
  onSelect: (id: string | null) => void;
  onTarget: (id: string | null) => void;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
  onTogglePublic: (id: string, isPublic: boolean) => void;
}) {
  const createList = () => {
    const name = window.prompt('Name der neuen Liste:')?.trim();
    if (name) onCreate(name);
  };

  return (
    <section className="rounded-xl border border-cinema-border bg-cinema-surface p-3">
      <div className="flex flex-wrap items-center gap-2">
        <ListPlus size={16} className="text-cinema-accent" />
        <span className="mr-1 text-sm font-semibold text-white">Eigene Listen</span>
        <button type="button" onClick={createList} className="inline-flex items-center gap-1 rounded-lg bg-cinema-accent/15 px-2.5 py-1.5 text-xs text-cinema-accent transition-colors hover:bg-cinema-accent hover:text-white">
          <Plus size={13} /> Neue Liste
        </button>
        <button type="button" onClick={() => onSelect(null)} className={`rounded-lg px-2.5 py-1.5 text-xs ${activeListId === null ? 'bg-cinema-accent text-white' : 'text-cinema-muted hover:text-white'}`}>
          Alle
        </button>
        {lists.map((list) => (
          <span key={list.id} className="inline-flex items-center gap-1">
            <button type="button" onClick={() => onSelect(list.id)} className={`rounded-lg px-2.5 py-1.5 text-xs ${activeListId === list.id ? 'bg-cinema-accent text-white' : 'text-cinema-muted hover:text-white'}`}>
              {list.name}
            </button>
            <button type="button" onClick={() => onTarget(targetListId === list.id ? null : list.id)} aria-label={`${list.name} als Ziel verwenden`} className={`rounded-lg px-1.5 py-1.5 text-xs ${targetListId === list.id ? 'bg-cinema-gold text-black' : 'text-cinema-muted hover:text-white'}`}>
              <Plus size={12} />
            </button>
            <button type="button" onClick={() => onTogglePublic(list.id, !list.is_public)} aria-label={`${list.name} ${list.is_public ? 'privat machen' : 'teilen'}`} className={`rounded-lg px-1.5 py-1.5 text-xs ${list.is_public ? 'text-cinema-gold' : 'text-cinema-muted hover:text-white'}`}>
              <Share2 size={12} />
            </button>
            <button type="button" onClick={() => onDelete(list.id)} aria-label={`${list.name} löschen`} className="text-cinema-muted hover:text-red-400"><X size={12} /></button>
          </span>
        ))}
      </div>
      {activeListId && <p className="mt-2 text-[11px] text-cinema-muted">Klicke auf einer Filmkarte auf „Zur Liste“, um den Film hinzuzufügen.</p>}
    </section>
  );
}