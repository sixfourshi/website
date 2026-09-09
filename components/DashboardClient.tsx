'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus, Search, Pencil, Trash2, LogOut, Zap, ExternalLink,
} from 'lucide-react';
import { Icon } from './Icon';
import { ScriptFormModal } from './ScriptFormModal';
import type { Script } from '@/lib/scripts';

export function DashboardClient({
  initialScripts,
}: {
  initialScripts: Script[];
}) {
  const router = useRouter();
  const [scripts, setScripts] = useState(initialScripts);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Script | null | undefined>(undefined);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scripts;
    return scripts.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
    );
  }, [scripts, query]);

  const onSaved = (script: Script) => {
    setScripts((prev) => {
      const idx = prev.findIndex((s) => s.slug === script.slug);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = script;
        return next;
      }
      return [...prev, script];
    });
    setEditing(undefined);
  };

  const onDelete = async (slug: string) => {
    setDeletingSlug(slug);
    try {
      await fetch(`/api/scripts/${slug}`, { method: 'DELETE' });
      setScripts((prev) => prev.filter((s) => s.slug !== slug));
    } finally {
      setDeletingSlug(null);
    }
  };

  const onLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-base/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-azure-400 to-azure-700">
              <Zap className="h-4 w-4 text-white" />
            </span>
            <span className="font-display text-base font-semibold text-white">
              Sour Hub
              <span className="ml-2 text-xs font-normal text-azure-300">
                Dashboard
              </span>
            </span>
          </Link>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-lg border border-line px-3.5 py-2 text-sm text-ink-muted transition-colors hover:border-azure-700 hover:text-ink"
          >
            <LogOut size={14} />
            Log out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">
              Your scripts
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {scripts.length} total &middot; visible only to you
            </p>
          </div>
          <button
            onClick={() => setEditing(null)}
            className="flex items-center gap-2 rounded-xl bg-azure-500 px-4 py-2.5 text-sm font-medium text-white shadow-glow-sm transition-colors hover:bg-azure-400"
          >
            <Plus size={16} />
            Add script
          </button>
        </div>

        <div className="relative mb-6 w-full sm:w-72">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your scripts..."
            className="w-full rounded-xl border border-line bg-surface/60 py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint focus:border-azure-600 focus:outline-none"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line py-16 text-center text-sm text-ink-muted">
            No scripts yet. Add your first one to get started.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-surface/40 text-left text-xs text-ink-faint">
                  <th className="px-5 py-3 font-medium">Script</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Version</th>
                  <th className="px-5 py-3 font-medium">Updated</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((script) => (
                  <tr
                    key={script.slug}
                    className="border-b border-line/60 last:border-0 hover:bg-surface/30"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-line bg-surface/60 text-azure-300">
                          <Icon name={script.icon} size={15} />
                        </span>
                        <span className="font-medium text-ink">
                          {script.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-ink-muted">
                      {script.category}
                    </td>
                    <td className="px-5 py-4 text-ink-muted">
                      v{script.version}
                    </td>
                    <td className="px-5 py-4 text-ink-muted">
                      {script.updatedAt}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/scripts/${script.slug}`}
                          target="_blank"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-muted hover:border-azure-700 hover:text-ink"
                          aria-label="View public page"
                        >
                          <ExternalLink size={14} />
                        </Link>
                        <button
                          onClick={() => setEditing(script)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-muted hover:border-azure-700 hover:text-ink"
                          aria-label="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(script.slug)}
                          disabled={deletingSlug === script.slug}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-muted hover:border-red-800 hover:text-red-400 disabled:opacity-50"
                          aria-label="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing !== undefined && (
        <ScriptFormModal
          script={editing}
          onClose={() => setEditing(undefined)}
          onSaved={onSaved}
        />
      )}
    </main>
  );
}
