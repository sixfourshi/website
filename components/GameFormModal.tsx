'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Image as ImageIcon, Loader2, Users, AlertCircle, Check } from 'lucide-react';
import { showToast } from './Toast';
import type { RobloxGame } from '@/lib/games';

export function GameFormModal({
  game,
  onClose,
  onSaved,
}: {
  game: RobloxGame | null;
  onClose: () => void;
  onSaved: (game: RobloxGame) => void;
}) {
  const isEdit = Boolean(game);

  const [form, setForm] = useState({
    name: game?.name ?? '',
    slug: game?.slug ?? '',
    robloxId: game?.rootPlaceId ? String(game.rootPlaceId) : game?.universeId ? String(game.universeId) : '',
    universeId: game?.universeId ?? null as number | null,
    rootPlaceId: game?.rootPlaceId ?? null as number | null,
    description: game?.description ?? '',
    iconUrl: game?.iconUrl ?? '',
    thumbnailUrl: game?.thumbnailUrl ?? '',
    featuresCount: game?.featuresCount ?? 20,
    isUniversal: game?.isUniversal ?? false,
  });

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEdit);
  const [fetchingRoblox, setFetchingRoblox] = useState(false);
  const [robloxSuccess, setRobloxSuccess] = useState<string | null>(null);
  const [robloxError, setRobloxError] = useState<string | null>(null);
  const [livePlaying, setLivePlaying] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const lookupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-slugify name if not manually edited
  const onNameChange = (val: string) => {
    setForm((prev) => {
      const nextSlug = !slugManuallyEdited
        ? val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : prev.slug;
      return { ...prev, name: val, slug: nextSlug };
    });
  };

  // Fetch Roblox place or universe metadata
  const fetchRobloxMetadata = async (idToFetch: string) => {
    const cleanId = idToFetch.trim();
    if (!cleanId || !/^\d+$/.test(cleanId)) return;

    setFetchingRoblox(true);
    setRobloxError(null);
    setRobloxSuccess(null);

    try {
      const res = await fetch(`/api/roblox/lookup?id=${cleanId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setRobloxError(data.error || 'Failed to fetch Roblox game details.');
        setFetchingRoblox(false);
        return;
      }

      setForm((prev) => ({
        ...prev,
        universeId: data.universeId ?? prev.universeId,
        rootPlaceId: data.rootPlaceId ?? prev.rootPlaceId,
        name: prev.name.trim() === '' ? data.name : prev.name,
        slug:
          prev.name.trim() === '' && !slugManuallyEdited
            ? data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            : prev.slug,
        description: prev.description.trim() === '' ? data.description : prev.description,
        iconUrl: data.iconUrl || prev.iconUrl,
        thumbnailUrl: data.thumbnailUrl || prev.thumbnailUrl,
      }));

      if (typeof data.playing === 'number') {
        setLivePlaying(data.playing);
      }

      setRobloxSuccess(
        `Loaded "${data.name}" (Universe ID: ${data.universeId}${
          data.rootPlaceId ? `, Place ID: ${data.rootPlaceId}` : ''
        })`
      );
    } catch {
      setRobloxError('Network error while querying Roblox API.');
    } finally {
      setFetchingRoblox(false);
    }
  };

  const onRobloxIdChange = (val: string) => {
    setForm((prev) => ({ ...prev, robloxId: val }));
    setRobloxError(null);
    setRobloxSuccess(null);

    if (lookupTimeoutRef.current) {
      clearTimeout(lookupTimeoutRef.current);
    }

    const clean = val.trim();
    // Auto-fetch if user enters a plausible numeric ID
    if (/^\d{6,}$/.test(clean)) {
      lookupTimeoutRef.current = setTimeout(() => {
        fetchRobloxMetadata(clean);
      }, 700);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError('');

    if (!form.name.trim()) {
      setError('Game name is required.');
      return;
    }

    const finalSlug = form.slug.trim() || form.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    if (!finalSlug) {
      setError('URL slug is required.');
      return;
    }

    setSaving(true);
    try {
      const url = isEdit ? `/api/games/${game!.slug}` : '/api/games';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        name: form.name.trim(),
        slug: finalSlug,
        universeId: form.universeId ? Number(form.universeId) : null,
        rootPlaceId: form.rootPlaceId ? Number(form.rootPlaceId) : undefined,
        description: form.description.trim(),
        iconUrl: form.iconUrl.trim(),
        thumbnailUrl: form.thumbnailUrl.trim(),
        featuresCount: Number(form.featuresCount) || 10,
        isUniversal: Boolean(form.isUniversal),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const err = data.error || 'Could not save game to persistent storage.';
        setError(err);
        showToast(err, 'error', 5000);
        setSaving(false);
        return;
      }

      const saved = await res.json();
      onSaved(saved);
    } catch (err: any) {
      const msg = err?.message || 'Something went wrong while saving. Please try again.';
      setError(msg);
      showToast(msg, 'error', 5000);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md px-4 py-6">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-line bg-[#09122f] p-6 shadow-glow">
        <div className="mb-5 flex items-center justify-between border-b border-line/60 pb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-white">
              {isEdit ? 'Edit Game' : 'Add New Game'}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Configure Roblox experience details, artwork, and loader metadata.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-slate-400 hover:text-white hover:border-azure-600 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Roblox Place or Universe ID with Auto-Fetch */}
          <div className="rounded-xl border border-azure-500/30 bg-azure-950/20 p-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-azure-200">
                Roblox Place or Universe ID
              </label>
              <span className="text-[11px] text-azure-300">
                Auto-fetches icon, banner &amp; player count
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 73956553001240 (Place ID) or 6931042565 (Universe ID)"
                value={form.robloxId}
                onChange={(e) => onRobloxIdChange(e.target.value)}
                className="w-full rounded-xl border border-line bg-[#060b1e] px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-azure-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => fetchRobloxMetadata(form.robloxId)}
                disabled={fetchingRoblox || !form.robloxId.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-azure-500/30 border border-azure-500/50 px-3.5 py-2.5 text-xs font-semibold text-azure-200 hover:bg-azure-500 hover:text-white disabled:opacity-50 transition-all whitespace-nowrap"
              >
                {fetchingRoblox ? (
                  <>
                    <Loader2 size={13} className="animate-spin text-azure-400" />
                    <span>Fetching...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} className="text-azure-300" />
                    <span>Fetch Data</span>
                  </>
                )}
              </button>
            </div>

            {/* Fetch Status Messages */}
            {robloxSuccess && (
              <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 px-3 py-1.5 text-xs text-emerald-300">
                <Check size={13} className="text-emerald-400 flex-none" />
                <span className="truncate">{robloxSuccess}</span>
              </div>
            )}
            {robloxError && (
              <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-red-950/40 border border-red-500/40 px-3 py-1.5 text-xs text-red-300">
                <AlertCircle size={13} className="text-red-400 flex-none" />
                <span>{robloxError}</span>
              </div>
            )}
            {livePlaying !== null && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-azure-500/10 border border-azure-500/30 px-2.5 py-0.5 text-[11px] text-azure-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <Users size={11} />
                <span>Live player count: {livePlaying.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Game Name & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                Game Name <span className="text-red-400">*</span>
              </label>
              <input
                required
                placeholder="e.g. Volleyball Legends"
                value={form.name}
                onChange={(e) => onNameChange(e.target.value)}
                className="w-full rounded-xl border border-line bg-[#060b1e] px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-azure-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                URL Slug <span className="text-red-400">*</span>
              </label>
              <input
                required
                placeholder="e.g. volleyball-legends"
                value={form.slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  setForm((f) => ({ ...f, slug: e.target.value }));
                }}
                className="w-full rounded-xl border border-line bg-[#060b1e] px-4 py-2.5 text-sm text-white placeholder:text-slate-400 font-mono text-xs focus:border-azure-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Description
            </label>
            <textarea
              placeholder="Brief summary of the game experience and script capabilities..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full resize-none rounded-xl border border-line bg-[#060b1e] px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-azure-500 focus:outline-none"
            />
          </div>

          {/* Icon URL and Thumbnail/Banner URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                Icon Image URL
              </label>
              <input
                placeholder="https://tr.rbxcdn.com/..."
                value={form.iconUrl}
                onChange={(e) => setForm((f) => ({ ...f, iconUrl: e.target.value }))}
                className="w-full rounded-xl border border-line bg-[#060b1e] px-3.5 py-2 text-xs text-white placeholder:text-slate-400 focus:border-azure-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                Banner / Thumbnail Image URL
              </label>
              <input
                placeholder="https://tr.rbxcdn.com/..."
                value={form.thumbnailUrl}
                onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))}
                className="w-full rounded-xl border border-line bg-[#060b1e] px-3.5 py-2 text-xs text-white placeholder:text-slate-400 focus:border-azure-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Live Visual Preview */}
          {(form.thumbnailUrl || form.iconUrl || form.name) && (
            <div className="overflow-hidden rounded-xl border border-line/80 bg-[#050a1b] p-3">
              <div className="text-[11px] font-medium text-slate-400 mb-2 flex items-center gap-1">
                <ImageIcon size={12} className="text-azure-400" />
                Live Card Preview
              </div>
              <div className="relative overflow-hidden rounded-lg border border-line/60 bg-[#0c1638] p-3 flex items-center gap-3">
                {form.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.iconUrl}
                    alt="Game icon"
                    className="h-12 w-12 rounded-xl object-cover border border-line/80 flex-none"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-azure-950 border border-azure-800 text-azure-400 flex-none">
                    <ImageIcon size={20} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-white text-sm truncate">
                    {form.name || 'Untitled Game'}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    /{form.slug || 'slug'} &middot; Universe ID: {form.universeId || 'None'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Features count & Universal Flag */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                Features Count Badge
              </label>
              <input
                type="number"
                min="0"
                value={form.featuresCount}
                onChange={(e) => setForm((f) => ({ ...f, featuresCount: Number(e.target.value) }))}
                className="w-full rounded-xl border border-line bg-[#060b1e] px-4 py-2 text-sm text-white focus:border-azure-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2.5 pt-6">
              <input
                type="checkbox"
                id="isUniversal"
                checked={form.isUniversal}
                onChange={(e) => setForm((f) => ({ ...f, isUniversal: e.target.checked }))}
                className="h-4 w-4 rounded border-line bg-[#060b1e] text-azure-500 focus:ring-azure-500"
              />
              <label htmlFor="isUniversal" className="text-xs text-slate-300 cursor-pointer">
                Is Universal Experience (all games)
              </label>
            </div>
          </div>

          {error && <p className="text-xs text-red-400 bg-red-950/30 p-2.5 rounded-lg border border-red-800/40">{error}</p>}

          <div className="flex justify-end gap-3 pt-3 border-t border-line/60">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-line px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-azure-500 px-5 py-2.5 text-sm font-medium text-white shadow-glow-sm hover:bg-azure-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {saving && (
                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
