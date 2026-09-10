'use client';

import { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Image as ImageIcon,
  Loader2,
  Users,
  AlertCircle,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Layers,
  Wand2,
} from 'lucide-react';
import { showToast } from './Toast';
import type { RobloxGame, GameTab, GameSection } from '@/lib/games';
import { countGameFeatures } from '@/lib/games';

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

  // Initialize tabs from existing game or default structure
  const initialTabs: GameTab[] =
    game?.tabs && Array.isArray(game.tabs) && game.tabs.length > 0
      ? JSON.parse(JSON.stringify(game.tabs))
      : [
          {
            name: 'Legit',
            sections: [
              {
                name: 'Silent Aim',
                features: ['Silent Aim', 'FOV', 'Miss Chance', 'Target Part', 'FOV Circle'],
              },
              {
                name: 'Aimbot',
                features: ['Aimbot', 'Hold Key', 'Smoothing'],
              },
            ],
          },
          {
            name: 'Rage',
            sections: [
              {
                name: 'Combat',
                features: ['Rapid Fire', 'Wallbang', 'Kill Aura'],
              },
            ],
          },
          {
            name: 'Visual',
            sections: [
              {
                name: 'ESP',
                features: ['Box ESP', 'Chams', 'Health Bar', 'Tracers'],
              },
            ],
          },
          {
            name: 'Cosmetics',
            sections: [
              {
                name: 'Skins',
                features: ['Unlock All Wraps', 'Weapon Glow'],
              },
            ],
          },
        ];

  const [form, setForm] = useState({
    name: game?.name ?? '',
    slug: game?.slug ?? '',
    robloxId: game?.rootPlaceId ? String(game.rootPlaceId) : game?.universeId ? String(game.universeId) : '',
    universeId: game?.universeId ?? (null as number | null),
    rootPlaceId: game?.rootPlaceId ?? (null as number | null),
    iconUrl: game?.iconUrl ?? '',
    thumbnailUrl: game?.thumbnailUrl ?? '',
    isUniversal: game?.isUniversal ?? false,
  });

  const [tabs, setTabs] = useState<GameTab[]>(initialTabs);
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [newFeatureInputs, setNewFeatureInputs] = useState<Record<number, string>>({});

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
        ? val
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
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
            ? data.name
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
            : prev.slug,
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
    if (/^\d{6,}$/.test(clean)) {
      lookupTimeoutRef.current = setTimeout(() => {
        fetchRobloxMetadata(clean);
      }, 700);
    }
  };

  // --- TAB MANAGEMENT ---
  const handleAddTab = () => {
    const name = prompt('Enter name for the new Tab (e.g. "Cosmetics", "Utility", "Misc"):');
    if (!name || !name.trim()) return;
    const newTab: GameTab = {
      name: name.trim(),
      sections: [{ name: 'Features', features: [] }],
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabIdx(tabs.length);
  };

  const handleRenameTab = (idx: number) => {
    const current = tabs[idx]?.name || '';
    const updated = prompt('Rename tab:', current);
    if (!updated || !updated.trim() || updated.trim() === current) return;
    setTabs((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], name: updated.trim() };
      return next;
    });
  };

  const handleMoveTab = (idx: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= tabs.length) return;
    setTabs((prev) => {
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
    setActiveTabIdx(targetIdx);
  };

  const handleDeleteTab = (idx: number) => {
    if (tabs.length <= 1) {
      showToast('A game must have at least one tab.', 'error', 3000);
      return;
    }
    const tabName = tabs[idx]?.name || 'this tab';
    if (!confirm(`Delete tab "${tabName}" and all its sections and features?`)) return;
    setTabs((prev) => prev.filter((_, i) => i !== idx));
    setActiveTabIdx((prev) => Math.max(0, prev >= idx ? prev - 1 : prev));
  };

  // --- SECTION MANAGEMENT ---
  const handleAddSection = () => {
    const currentTab = tabs[activeTabIdx];
    if (!currentTab) return;
    const sectionName = prompt('Enter section name (e.g. "Silent Aim", "Movement", "ESP"):');
    if (!sectionName || !sectionName.trim()) return;

    setTabs((prev) => {
      const next = [...prev];
      const targetTab = { ...next[activeTabIdx] };
      targetTab.sections = [
        ...targetTab.sections,
        { name: sectionName.trim(), features: [] },
      ];
      next[activeTabIdx] = targetTab;
      return next;
    });
  };

  const handleRenameSection = (secIdx: number, newName: string) => {
    setTabs((prev) => {
      const next = [...prev];
      const targetTab = { ...next[activeTabIdx] };
      const nextSections = [...targetTab.sections];
      nextSections[secIdx] = { ...nextSections[secIdx], name: newName };
      targetTab.sections = nextSections;
      next[activeTabIdx] = targetTab;
      return next;
    });
  };

  const handleMoveSection = (secIdx: number, direction: 'up' | 'down') => {
    const currentTab = tabs[activeTabIdx];
    if (!currentTab) return;
    const targetIdx = direction === 'up' ? secIdx - 1 : secIdx + 1;
    if (targetIdx < 0 || targetIdx >= currentTab.sections.length) return;

    setTabs((prev) => {
      const next = [...prev];
      const targetTab = { ...next[activeTabIdx] };
      const nextSections = [...targetTab.sections];
      const temp = nextSections[secIdx];
      nextSections[secIdx] = nextSections[targetIdx];
      nextSections[targetIdx] = temp;
      targetTab.sections = nextSections;
      next[activeTabIdx] = targetTab;
      return next;
    });
  };

  const handleDeleteSection = (secIdx: number) => {
    setTabs((prev) => {
      const next = [...prev];
      const targetTab = { ...next[activeTabIdx] };
      targetTab.sections = targetTab.sections.filter((_, i) => i !== secIdx);
      next[activeTabIdx] = targetTab;
      return next;
    });
  };

  // --- FEATURE MANAGEMENT ---
  const handleAddFeature = (secIdx: number) => {
    const rawVal = newFeatureInputs[secIdx]?.trim();
    if (!rawVal) return;

    // Support comma-separated items
    const splitFeatures = rawVal
      .split(/[,;\n]/)
      .map((f) => f.trim())
      .filter(Boolean);

    if (splitFeatures.length === 0) return;

    setTabs((prev) => {
      const next = [...prev];
      const targetTab = { ...next[activeTabIdx] };
      const nextSections = [...targetTab.sections];
      const sec = { ...nextSections[secIdx] };
      sec.features = [...sec.features, ...splitFeatures];
      nextSections[secIdx] = sec;
      targetTab.sections = nextSections;
      next[activeTabIdx] = targetTab;
      return next;
    });

    setNewFeatureInputs((prev) => ({ ...prev, [secIdx]: '' }));
  };

  const handleDeleteFeature = (secIdx: number, featIdx: number) => {
    setTabs((prev) => {
      const next = [...prev];
      const targetTab = { ...next[activeTabIdx] };
      const nextSections = [...targetTab.sections];
      const sec = { ...nextSections[secIdx] };
      sec.features = sec.features.filter((_, i) => i !== featIdx);
      nextSections[secIdx] = sec;
      targetTab.sections = nextSections;
      next[activeTabIdx] = targetTab;
      return next;
    });
  };

  const handleMoveFeature = (secIdx: number, featIdx: number, direction: 'left' | 'right') => {
    setTabs((prev) => {
      const next = [...prev];
      const targetTab = { ...next[activeTabIdx] };
      const nextSections = [...targetTab.sections];
      const sec = { ...nextSections[secIdx] };
      const targetIdx = direction === 'left' ? featIdx - 1 : featIdx + 1;
      if (targetIdx < 0 || targetIdx >= sec.features.length) return prev;
      const feats = [...sec.features];
      const temp = feats[featIdx];
      feats[featIdx] = feats[targetIdx];
      feats[targetIdx] = temp;
      sec.features = feats;
      nextSections[secIdx] = sec;
      targetTab.sections = nextSections;
      next[activeTabIdx] = targetTab;
      return next;
    });
  };

  const totalFeatures = countGameFeatures({ tabs });

  // Submit to API
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError('');

    if (!form.name.trim()) {
      setError('Game name is required.');
      return;
    }

    const finalSlug =
      form.slug.trim() ||
      form.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-');
    if (!finalSlug) {
      setError('URL slug is required.');
      return;
    }

    if (tabs.length === 0) {
      setError('At least one tab with features is required.');
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
        iconUrl: form.iconUrl.trim(),
        thumbnailUrl: form.thumbnailUrl.trim(),
        isUniversal: Boolean(form.isUniversal),
        tabs,
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
      showToast(
        isEdit ? `Updated "${saved.name}" successfully.` : `Added "${saved.name}" to supported games.`,
        'success',
        4000
      );
      onSaved(saved);
    } catch (err: any) {
      const msg = err?.message || 'Something went wrong while saving. Please try again.';
      setError(msg);
      showToast(msg, 'error', 5000);
      setSaving(false);
    }
  };

  const currentTab = tabs[activeTabIdx];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 py-6">
      <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-line bg-[#09122f] p-6 shadow-glow">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b border-line/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold text-white">
                {isEdit ? 'Edit Game & Structured Features' : 'Add Supported Game'}
              </h2>
              <span className="rounded-full border border-azure-500/40 bg-azure-950/60 px-2.5 py-0.5 text-xs font-semibold text-azure-300">
                {totalFeatures} features total
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Configure Roblox experience artwork, tabs, sections, and compact feature chips.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-slate-400 hover:text-white hover:border-azure-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* SECTION 1: ROBLOX GAME DETAILS */}
          <div className="space-y-4 rounded-xl border border-line/60 bg-[#060b1e]/70 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-azure-300 flex items-center gap-2">
              <Layers size={14} />
              <span>1. Game Information & Roblox Assets</span>
            </h3>

            {/* Live Roblox Auto-Lookup */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Roblox Place ID or Universe ID</span>
                <span className="text-[11px] text-azure-400">Auto-fills game details & artwork</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.robloxId}
                  onChange={(e) => onRobloxIdChange(e.target.value)}
                  placeholder="e.g. 17625359962 (Rivals) or Universe ID"
                  className="w-full rounded-xl border border-line bg-[#081028] px-4 py-2 text-xs text-white placeholder-slate-500 focus:border-azure-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => fetchRobloxMetadata(form.robloxId)}
                  disabled={fetchingRoblox || !form.robloxId.trim()}
                  className="absolute right-1.5 top-1.5 rounded-lg bg-azure-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-azure-500 disabled:opacity-50 transition-colors"
                >
                  {fetchingRoblox ? (
                    <span className="flex items-center gap-1">
                      <Loader2 size={11} className="animate-spin" />
                      Fetching...
                    </span>
                  ) : (
                    'Lookup'
                  )}
                </button>
              </div>

              {robloxSuccess && (
                <p className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
                  <Sparkles size={11} />
                  <span>{robloxSuccess}</span>
                </p>
              )}
              {robloxError && (
                <p className="mt-1 text-[11px] text-amber-400 flex items-center gap-1">
                  <AlertCircle size={11} />
                  <span>{robloxError}</span>
                </p>
              )}
            </div>

            {/* Name and Slug Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Game Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="e.g. Rivals"
                  required
                  className="w-full rounded-xl border border-line bg-[#081028] px-4 py-2 text-xs text-white placeholder-slate-500 focus:border-azure-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  URL Slug <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center rounded-xl border border-line bg-[#081028] px-3 py-2 text-xs">
                  <span className="text-slate-500 select-none mr-1">/games/</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugManuallyEdited(true);
                      setForm((prev) => ({ ...prev, slug: e.target.value }));
                    }}
                    placeholder="rivals"
                    required
                    className="w-full bg-transparent text-azure-300 font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Icon & Thumbnail Preview Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Icon URL</label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={form.iconUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, iconUrl: e.target.value }))}
                    placeholder="https://tr.rbxcdn.com/..."
                    className="w-full rounded-xl border border-line bg-[#081028] px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-azure-500 focus:outline-none"
                  />
                  {form.iconUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.iconUrl}
                      alt="Icon Preview"
                      className="h-8 w-8 rounded-lg object-cover border border-line flex-none"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Thumbnail / Banner URL</label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={form.thumbnailUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, thumbnailUrl: e.target.value }))}
                    placeholder="https://tr.rbxcdn.com/..."
                    className="w-full rounded-xl border border-line bg-[#081028] px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-azure-500 focus:outline-none"
                  />
                  {form.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.thumbnailUrl}
                      alt="Thumb Preview"
                      className="h-8 w-14 rounded-lg object-cover border border-line flex-none"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Universal checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isUniversal"
                checked={form.isUniversal}
                onChange={(e) => setForm((prev) => ({ ...prev, isUniversal: e.target.checked }))}
                className="h-4 w-4 rounded border-line bg-[#081028] text-azure-500 focus:ring-0"
              />
              <label htmlFor="isUniversal" className="text-xs text-slate-300 cursor-pointer">
                Is Universal Experience (compatible across all Roblox games)
              </label>
            </div>
          </div>

          {/* SECTION 2: STRUCTURED FEATURE EDITOR (tabs -> sections -> features) */}
          <div className="space-y-4 rounded-xl border border-azure-500/40 bg-[#060b1e]/90 p-4 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line/60 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-azure-300 flex items-center gap-2">
                  <Sparkles size={14} />
                  <span>2. Structured Features Editor (tabs → sections → features)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Matches the expandable card layout. Create tabs, sections, and add compact feature chips.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddTab}
                className="inline-flex items-center gap-1.5 rounded-lg border border-azure-500/50 bg-azure-500/20 px-3 py-1.5 text-xs font-semibold text-azure-200 hover:bg-azure-500 hover:text-white transition-all cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Tab</span>
              </button>
            </div>

            {/* Tabs List (Interactive Pills) */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {tabs.map((tab, idx) => {
                const isActive = activeTabIdx === idx;
                return (
                  <div
                    key={tab.name + idx}
                    className={`group flex items-center rounded-full border transition-all ${
                      isActive
                        ? 'border-azure-400 bg-azure-500/30 text-white shadow-glow-sm'
                        : 'border-line/70 bg-[#091330] text-slate-400 hover:border-azure-500/40 hover:text-slate-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveTabIdx(idx)}
                      className="px-3 py-1 text-xs font-medium cursor-pointer"
                    >
                      {tab.name}
                    </button>

                    {/* Tab Reorder & Delete controls */}
                    <div className="flex items-center pr-2 gap-0.5 opacity-70 group-hover:opacity-100">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveTab(idx, 'left')}
                          title="Move tab left"
                          className="hover:text-azure-300 p-0.5"
                        >
                          <ChevronLeft size={11} />
                        </button>
                      )}
                      {idx < tabs.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveTab(idx, 'right')}
                          title="Move tab right"
                          className="hover:text-azure-300 p-0.5"
                        >
                          <ChevronRight size={11} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRenameTab(idx)}
                        title="Rename tab"
                        className="hover:text-azure-300 px-0.5 text-[10px]"
                      >
                        ✎
                      </button>
                      {tabs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTab(idx)}
                          title="Delete tab"
                          className="hover:text-red-400 p-0.5"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Tab Content: Sections & Features */}
            {currentTab ? (
              <div className="space-y-4 rounded-xl border border-line/70 bg-[#070e28] p-4 mt-3">
                <div className="flex items-center justify-between border-b border-line/50 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">
                      Sections in <span className="text-azure-300">&ldquo;{currentTab.name}&rdquo;</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({currentTab.sections.reduce((acc, s) => acc + s.features.length, 0)} features)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="inline-flex items-center gap-1 rounded-lg border border-line/80 bg-[#0c163a] px-2.5 py-1 text-xs text-slate-300 hover:border-azure-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Add Section</span>
                  </button>
                </div>

                {/* Sections Loop */}
                {currentTab.sections.length > 0 ? (
                  <div className="space-y-4">
                    {currentTab.sections.map((section, secIdx) => (
                      <div
                        key={secIdx}
                        className="rounded-xl border border-line/60 bg-[#050a1d]/80 p-3.5 space-y-2.5"
                      >
                        {/* Section Header */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={section.name}
                              onChange={(e) => handleRenameSection(secIdx, e.target.value)}
                              placeholder="Section Name (e.g. SILENT AIM)"
                              className="font-mono text-[11px] font-bold tracking-wider text-azure-300 uppercase bg-transparent border-b border-transparent focus:border-azure-400 focus:outline-none w-48"
                            />
                            <span className="text-[10px] text-slate-500">
                              ({section.features.length} features)
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {secIdx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleMoveSection(secIdx, 'up')}
                                title="Move section up"
                                className="rounded p-1 text-slate-400 hover:text-white hover:bg-white/5"
                              >
                                <ChevronUp size={13} />
                              </button>
                            )}
                            {secIdx < currentTab.sections.length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleMoveSection(secIdx, 'down')}
                                title="Move section down"
                                className="rounded p-1 text-slate-400 hover:text-white hover:bg-white/5"
                              >
                                <ChevronDown size={13} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteSection(secIdx)}
                              title="Delete section"
                              className="rounded p-1 text-slate-400 hover:text-red-400 hover:bg-white/5 ml-1"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Feature Chips */}
                        <div className="flex flex-wrap items-center gap-1.5 min-h-[32px] pt-1">
                          {section.features.map((feat, featIdx) => (
                            <span
                              key={feat + featIdx}
                              className="group inline-flex items-center gap-1 rounded-full border border-azure-500/25 bg-[#0a1538] px-2.5 py-0.5 text-xs text-slate-200"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-azure-400 flex-none" />
                              <span>{feat}</span>
                              {featIdx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveFeature(secIdx, featIdx, 'left')}
                                  title="Move left"
                                  className="hidden group-hover:inline text-slate-400 hover:text-azure-300"
                                >
                                  <ChevronLeft size={10} />
                                </button>
                              )}
                              {featIdx < section.features.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveFeature(secIdx, featIdx, 'right')}
                                  title="Move right"
                                  className="hidden group-hover:inline text-slate-400 hover:text-azure-300"
                                >
                                  <ChevronRight size={10} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteFeature(secIdx, featIdx)}
                                title="Remove feature"
                                className="text-slate-400 hover:text-red-400 ml-0.5"
                              >
                                <X size={11} />
                              </button>
                            </span>
                          ))}

                          {section.features.length === 0 && (
                            <span className="text-xs text-slate-500 italic">
                              No features yet. Type below to add.
                            </span>
                          )}
                        </div>

                        {/* Add Feature Input */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={newFeatureInputs[secIdx] || ''}
                            onChange={(e) =>
                              setNewFeatureInputs((prev) => ({
                                ...prev,
                                [secIdx]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddFeature(secIdx);
                              }
                            }}
                            placeholder="Add feature (or paste comma-separated list)..."
                            className="flex-1 rounded-lg border border-line/70 bg-[#081028] px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-azure-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddFeature(secIdx)}
                            className="rounded-lg bg-azure-600/60 px-3 py-1.5 text-xs font-medium text-white hover:bg-azure-500 transition-colors cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No sections in this tab. Click &ldquo;Add Section&rdquo; above.
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/30 p-2.5 rounded-lg border border-red-800/40">
              {error}
            </p>
          )}

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-line/60">
            <div className="text-xs text-slate-400">
              Total:&nbsp;
              <span className="font-semibold text-azure-300">{tabs.length} tabs</span>,&nbsp;
              <span className="font-semibold text-azure-300">{totalFeatures} features</span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-line px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
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
          </div>
        </form>
      </div>
    </div>
  );
}
