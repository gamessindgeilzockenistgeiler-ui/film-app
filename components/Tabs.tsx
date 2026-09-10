'use client';

import { LayoutGrid, Sparkles } from 'lucide-react';

export type TabKey = 'list' | 'ai';

export default function Tabs({ active, onChange }: { active: TabKey; onChange: (tab: TabKey) => void }) {
  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'list', label: 'Meine Liste', icon: <LayoutGrid size={16} /> },
    { key: 'ai', label: 'KI-Empfehlung', icon: <Sparkles size={16} /> },
  ];

  return (
    <div className="inline-flex rounded-xl border border-cinema-border bg-cinema-surface p-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            active === t.key ? 'bg-cinema-accent text-white' : 'text-cinema-muted hover:text-white'
          }`}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}
