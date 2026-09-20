'use client';

import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { showToast } from './Toast';
import type { Script } from '@/lib/scripts';
import type { RobloxGame } from '@/lib/games';

const ICON_OPTIONS = [
  'FileCode', 'Orbit', 'Waypoints', 'Eye', 'Hammer', 'Workflow',
  'LayoutPanelLeft', 'Zap', 'Target', 'Shield',
];

export function ScriptFormModal({
  script,
  games = [],
  onClose,
  onSaved,
}: {
  script: Script | null;
  games?: RobloxGame[];
  onClose: () => void;
  onSaved: (script: Script) => void;
}) {
  const isEdit = Boolean(script);
  const [form, setForm] = useState({
    name: script?.name ?? '',
    description: script?.description ?? '',
    category: script?.category ?? 'Utility',
    game: script?.game ?? 'universal',
    version: script?.version ?? '1.0.0',
    icon: script?.icon ?? 'FileCode',
    code: script?.code ?? '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError('');
    setSaving(true);
    try {
      const url = isEdit ? `/api/scripts/${script!.slug}` : '/api/scripts';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const err = data.error || 'Could not save script to persistent storage.';
        setError(err);
        showToast(err, 'error', 5000);
        setSaving(false);
        return;
      }
      const saved = await res.json();
      onSaved(saved);
    } catch (err: any) {
      const msg = err?.message || 'Something went wrong while saving. Try again.';
      setError(msg);
      showToast(msg, 'error', 5000);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4 py-6">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-[#0c0c0f] p-6 shadow-glow">
        <div className="mb-5 flex items-center justify-between border-b border-line/60 pb-3">
          <h2 className="font-display text-lg font-semibold text-white">
            {isEdit ? 'Edit Script' : 'Add Script'}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-slate-400 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-300">
            <AlertCircle size={15} className="flex-none text-red-400" />
            <p className="min-w-0 flex-1">{error}</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="w-full rounded-xl border border-line bg-black/60 px-4 py-2.5 text-sm text-white focus:border-zinc-500 focus:outline-none"
            />
          </div>

          {/* Assigned Game Selector */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Assigned Game
            </label>
            <select
              value={form.game.toLowerCase()}
              onChange={(e) => update('game', e.target.value)}
              className="w-full rounded-xl border border-line bg-black/60 px-4 py-2.5 text-sm text-white focus:border-zinc-500 focus:outline-none"
            >
              <option value="universal">Universal (All Games)</option>
              {games
                .filter((g) => g.slug.toLowerCase() !== 'universal')
                .map((g) => (
                  <option key={g.slug} value={g.slug.toLowerCase()}>
                    {g.name} ({g.slug})
                  </option>
                ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-400">
              This script will appear under this game&apos;s tab and in its loader routing.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={2}
              className="w-full resize-none rounded-xl border border-line bg-black/60 px-4 py-2.5 text-sm text-white focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                Category
              </label>
              <input
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                className="w-full rounded-xl border border-line bg-black/60 px-4 py-2.5 text-sm text-white focus:border-zinc-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                Version
              </label>
              <input
                value={form.version}
                onChange={(e) => update('version', e.target.value)}
                className="w-full rounded-xl border border-line bg-black/60 px-4 py-2.5 text-sm text-white focus:border-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Icon</label>
            <select
              value={form.icon}
              onChange={(e) => update('icon', e.target.value)}
              className="w-full rounded-xl border border-line bg-black/60 px-4 py-2.5 text-sm text-white focus:border-zinc-500 focus:outline-none"
            >
              {ICON_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Luau source
            </label>
            <textarea
              value={form.code}
              onChange={(e) => update('code', e.target.value)}
              rows={8}
              className="w-full resize-y rounded-xl border border-line bg-black/60 px-4 py-2.5 font-mono text-xs text-white focus:border-zinc-500 focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-3 pt-2 border-t border-line/60">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-line px-4 py-2.5 text-sm text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-glow-sm hover:bg-zinc-200 disabled:opacity-60 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {saving && (
                <svg className="h-4 w-4 animate-spin text-black" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Add script'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
