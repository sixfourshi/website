'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { Script } from '@/lib/scripts';

const ICON_OPTIONS = [
  'FileCode', 'Orbit', 'Waypoints', 'Eye', 'Hammer', 'Workflow',
  'LayoutPanelLeft', 'Zap', 'Target', 'Shield',
];

export function ScriptFormModal({
  script,
  onClose,
  onSaved,
}: {
  script: Script | null;
  onClose: () => void;
  onSaved: (script: Script) => void;
}) {
  const isEdit = Boolean(script);
  const [form, setForm] = useState({
    name: script?.name ?? '',
    description: script?.description ?? '',
    category: script?.category ?? 'Utility',
    game: script?.game ?? 'Universal',
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
        setError(data.error || 'Could not save script.');
        setSaving(false);
        return;
      }
      const saved = await res.json();
      onSaved(saved);
    } catch {
      setError('Something went wrong. Try again.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-base p-6 shadow-glow">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">
            {isEdit ? 'Edit script' : 'Add script'}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-muted hover:text-ink"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-ink-muted">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="w-full rounded-xl border border-line bg-surface/60 px-4 py-2.5 text-sm text-ink focus:border-azure-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-ink-muted">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={2}
              className="w-full resize-none rounded-xl border border-line bg-surface/60 px-4 py-2.5 text-sm text-ink focus:border-azure-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs text-ink-muted">
                Category
              </label>
              <input
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                className="w-full rounded-xl border border-line bg-surface/60 px-4 py-2.5 text-sm text-ink focus:border-azure-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-ink-muted">
                Version
              </label>
              <input
                value={form.version}
                onChange={(e) => update('version', e.target.value)}
                className="w-full rounded-xl border border-line bg-surface/60 px-4 py-2.5 text-sm text-ink focus:border-azure-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-ink-muted">Icon</label>
            <select
              value={form.icon}
              onChange={(e) => update('icon', e.target.value)}
              className="w-full rounded-xl border border-line bg-surface/60 px-4 py-2.5 text-sm text-ink focus:border-azure-600 focus:outline-none"
            >
              {ICON_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-ink-muted">
              Luau source
            </label>
            <textarea
              value={form.code}
              onChange={(e) => update('code', e.target.value)}
              rows={8}
              className="w-full resize-y rounded-xl border border-line bg-surface/60 px-4 py-2.5 font-mono text-xs text-ink focus:border-azure-600 focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-line px-4 py-2.5 text-sm text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-azure-500 px-5 py-2.5 text-sm font-medium text-white shadow-glow-sm hover:bg-azure-400 disabled:opacity-60"
            >
              {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Add script'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
