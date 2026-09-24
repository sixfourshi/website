'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  LogOut,
  Zap,
  ExternalLink,
  Gamepad2,
  FileCode2,
  Sparkles,
  Layers,
  Image as ImageIcon,
  MessageSquare,
  Activity,
  History,
  Copy,
  Check,
  Database,
  X,
} from 'lucide-react';
import { Icon } from './Icon';
import { copyToClipboard, showToast } from './Toast';
import { ScriptFormModal } from './ScriptFormModal';
import { GameFormModal } from './GameFormModal';
import { DeleteGameModal } from './DeleteGameModal';
import { DeleteScriptModal } from './DeleteScriptModal';
import { BulkDeleteModal } from './BulkDeleteModal';
import { UniversalLoaderManager } from './UniversalLoaderManager';
import { SuggestionsTab } from './SuggestionsTab';
import { ExecutionLogsTab } from './ExecutionLogsTab';
import { ChangelogManager } from './ChangelogManager';
import type { Script } from '@/lib/scripts';
import type { RobloxGame } from '@/lib/games';
import { countGameFeatures } from '@/lib/games';
import type { UniversalLoaderConfig } from '@/lib/loader-types';
import type { Suggestion } from '@/lib/suggestions';
import type { ChangelogRelease } from '@/lib/changelog-utils';
import {
  formatExecutionCount,
  type ExecutionAnalytics,
  type ExecutionLog,
} from '@/lib/execution-types';

export function DashboardClient({
  initialScripts,
  initialGames,
  initialLoaderConfig,
  initialSuggestions = [],
  initialAnalytics,
  initialExecutionLogs = [],
  initialChangelog = [],
}: {
  initialScripts: Script[];
  initialGames: RobloxGame[];
  initialLoaderConfig?: UniversalLoaderConfig;
  initialSuggestions?: Suggestion[];
  initialAnalytics?: ExecutionAnalytics;
  initialExecutionLogs?: ExecutionLog[];
  initialChangelog?: ChangelogRelease[];
}) {
  const router = useRouter();
  const [scripts, setScripts] = useState<Script[]>(initialScripts);
  const [games, setGames] = useState<RobloxGame[]>(initialGames);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggestions);

  const [activeTab, setActiveTab] = useState<'games' | 'scripts' | 'suggestions' | 'executions' | 'changelog'>('games');
  const [query, setQuery] = useState('');

  const pendingSuggestionsCount = useMemo(
    () => suggestions.filter((s) => s.status === 'pending').length,
    [suggestions]
  );

  // Script modals
  const [editingScript, setEditingScript] = useState<Script | null | undefined>(undefined);
  const [deletingScript, setDeletingScript] = useState<Script | null>(null);
  const [copiedRawSlug, setCopiedRawSlug] = useState<string | null>(null);

  const handleCopyRawUrl = async (slug: string) => {
    const rawUrl = `https://novahub.vercel.app/raw/${slug}`;
    const ok = await copyToClipboard(rawUrl, 'Raw URL copied to clipboard!');
    if (ok) {
      setCopiedRawSlug(slug);
      setTimeout(() => {
        setCopiedRawSlug((curr) => (curr === slug ? null : curr));
      }, 2000);
    }
  };

  // Game modals
  const [editingGame, setEditingGame] = useState<RobloxGame | null | undefined>(undefined);
  const [deletingGame, setDeletingGame] = useState<RobloxGame | null>(null);

  // Storage diagnostics
  const [isRunningDiag, setIsRunningDiag] = useState(false);
  const [diagReport, setDiagReport] = useState<any | null>(null);
  const [diagModalOpen, setDiagModalOpen] = useState(false);

  const handleRunStorageDiagnostics = async () => {
    setIsRunningDiag(true);
    try {
      const res = await fetch('/api/admin/storage-diagnostics');
      const data = await res.json();
      setDiagReport(data);
      setDiagModalOpen(true);
      if (data.overallSuccess) {
        showToast('Storage write test passed', 'success', 3000, data.summary);
      } else {
        showToast('Storage write test failed', 'error', 5000, data.summary || data.error);
      }
    } catch (err: any) {
      showToast('Storage test failed to run', 'error', 4000, err?.message);
    } finally {
      setIsRunningDiag(false);
    }
  };

  // Filtered games
  const filteredGames = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return games;
    return games.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.slug.toLowerCase().includes(q) ||
        (g.universeId && String(g.universeId).includes(q)) ||
        (g.rootPlaceId && String(g.rootPlaceId).includes(q))
    );
  }, [games, query]);

  // Filtered scripts
  const filteredScripts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scripts;
    return scripts.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.game.toLowerCase().includes(q)
    );
  }, [scripts, query]);

  // Count scripts assigned to each game
  const scriptsCountByGame = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of scripts) {
      const g = (s.game || 'universal').toLowerCase();
      map[g] = (map[g] || 0) + 1;
    }
    return map;
  }, [scripts]);

  // Multi-select for Games
  const [selectedGameSlugs, setSelectedGameSlugs] = useState<string[]>([]);
  const [isBulkDeletingGames, setIsBulkDeletingGames] = useState(false);

  const isAllGamesSelected =
    filteredGames.length > 0 && filteredGames.every((g) => selectedGameSlugs.includes(g.slug));

  const toggleSelectAllGames = () => {
    if (isAllGamesSelected) {
      setSelectedGameSlugs([]);
    } else {
      setSelectedGameSlugs(filteredGames.map((g) => g.slug));
    }
  };

  const toggleSelectGame = (slug: string) => {
    setSelectedGameSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const clearSelectedGames = () => {
    setSelectedGameSlugs([]);
  };

  const selectAllGames = () => {
    setSelectedGameSlugs(filteredGames.map((g) => g.slug));
  };

  const handleBulkDeleteGamesConfirm = async () => {
    if (selectedGameSlugs.length === 0) return;
    const slugsToDelete = [...selectedGameSlugs];
    const res = await fetch('/api/games', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slugs: slugsToDelete }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete selected games.');
    }

    // Refresh games list from server
    const freshRes = await fetch('/api/games', { cache: 'no-store' });
    if (freshRes.ok) {
      const freshGames = await freshRes.json();
      setGames(freshGames);
    } else {
      setGames((prev) => prev.filter((g) => !slugsToDelete.includes(g.slug)));
    }

    setSelectedGameSlugs([]);
    showToast(
      `Deleted ${slugsToDelete.length} games`,
      'success',
      3000,
      'Permanently removed from storage'
    );
    router.refresh();
  };

  // Multi-select for Scripts
  const [selectedScriptSlugs, setSelectedScriptSlugs] = useState<string[]>([]);
  const [isBulkDeletingScripts, setIsBulkDeletingScripts] = useState(false);

  const isAllScriptsSelected =
    filteredScripts.length > 0 && filteredScripts.every((s) => selectedScriptSlugs.includes(s.slug));

  const toggleSelectAllScripts = () => {
    if (isAllScriptsSelected) {
      setSelectedScriptSlugs([]);
    } else {
      setSelectedScriptSlugs(filteredScripts.map((s) => s.slug));
    }
  };

  const toggleSelectScript = (slug: string) => {
    setSelectedScriptSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const clearSelectedScripts = () => {
    setSelectedScriptSlugs([]);
  };

  const selectAllScripts = () => {
    setSelectedScriptSlugs(filteredScripts.map((s) => s.slug));
  };

  const handleBulkDeleteScriptsConfirm = async () => {
    if (selectedScriptSlugs.length === 0) return;
    const slugsToDelete = [...selectedScriptSlugs];
    const res = await fetch('/api/scripts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slugs: slugsToDelete }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete selected scripts.');
    }

    // Refresh scripts from server
    const freshRes = await fetch('/api/scripts', { cache: 'no-store' });
    if (freshRes.ok) {
      const freshScripts = await freshRes.json();
      setScripts(freshScripts);
    } else {
      setScripts((prev) => prev.filter((s) => !slugsToDelete.includes(s.slug)));
    }

    setSelectedScriptSlugs([]);
    showToast(
      `Deleted ${slugsToDelete.length} scripts`,
      'success',
      3000,
      'Permanently removed from storage'
    );
    router.refresh();
  };

  // Handle Game Save (create or update)
  const onGameSaved = async (savedGame: RobloxGame) => {
    const isEditMode = Boolean(editingGame);
    setEditingGame(undefined);

    // Refresh the dashboard data from the server after saving instead of updating only React state
    try {
      const res = await fetch('/api/games', { cache: 'no-store' });
      if (res.ok) {
        const freshGames = await res.json();
        setGames(freshGames);
      } else {
        setGames((prev) => {
          const idx = prev.findIndex((g) => g.slug === savedGame.slug);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = savedGame;
            return next;
          }
          return [...prev, savedGame];
        });
      }
    } catch {
      setGames((prev) => {
        const idx = prev.findIndex((g) => g.slug === savedGame.slug);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = savedGame;
          return next;
        }
        return [...prev, savedGame];
      });
    }

    showToast(
      isEditMode ? `Updated "${savedGame.name}"` : `Added "${savedGame.name}"`,
      'success',
      3200,
      'Saved persistently'
    );
    router.refresh();
  };

  // Handle Game Delete with chosen scriptAction
  const onGameDeleteConfirmed = async (
    slug: string,
    scriptAction: 'keep' | 'reassign' | 'delete'
  ) => {
    const gameName = deletingGame?.name || slug;
    try {
      const res = await fetch(`/api/games/${slug}?action=${scriptAction}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete game.');
      }

      // Refresh both games and scripts from the server to guarantee consistency
      try {
        const [gamesRes, scriptsRes] = await Promise.all([
          fetch('/api/games', { cache: 'no-store' }),
          fetch('/api/scripts', { cache: 'no-store' }),
        ]);
        if (gamesRes.ok) setGames(await gamesRes.json());
        if (scriptsRes.ok) setScripts(await scriptsRes.json());
      } catch {
        // Fallback local update if network glitch
        setGames((prev) => prev.filter((g) => g.slug !== slug));
        if (scriptAction === 'delete') {
          setScripts((prev) => prev.filter((s) => s.game.toLowerCase() !== slug.toLowerCase()));
        } else if (scriptAction === 'reassign') {
          setScripts((prev) =>
            prev.map((s) =>
              s.game.toLowerCase() === slug.toLowerCase() ? { ...s, game: 'universal' } : s
            )
          );
        }
      }

      setDeletingGame(null);
      showToast(
        `Deleted "${gameName}"`,
        'success',
        3200,
        scriptAction === 'reassign'
          ? 'Associated scripts moved to Universal'
          : scriptAction === 'delete'
          ? 'Game and associated scripts removed'
          : 'Game removed from library'
      );
      router.refresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete game.', 'error', 4000);
      throw err;
    }
  };

  // Handle Script Save
  const onScriptSaved = async (script: Script) => {
    const isEditMode = Boolean(editingScript);
    setEditingScript(undefined);

    // Refresh scripts from server
    try {
      const res = await fetch('/api/scripts', { cache: 'no-store' });
      if (res.ok) {
        const freshScripts = await res.json();
        setScripts(freshScripts);
      } else {
        setScripts((prev) => {
          const idx = prev.findIndex((s) => s.slug === script.slug);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = script;
            return next;
          }
          return [...prev, script];
        });
      }
    } catch {
      setScripts((prev) => {
        const idx = prev.findIndex((s) => s.slug === script.slug);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = script;
          return next;
        }
        return [...prev, script];
      });
    }

    showToast(
      isEditMode ? `Updated "${script.name}"` : `Added "${script.name}"`,
      'success',
      3200,
      'Saved persistently'
    );
    router.refresh();
  };

  // Handle Script Delete with confirmed modal and fresh server reload
  const onScriptDeleteConfirmed = async (slug: string) => {
    try {
      const res = await fetch(`/api/scripts/${slug}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete script from persistent storage.');
      }

      // Reload fresh scripts directly from the server
      const freshRes = await fetch('/api/scripts', { cache: 'no-store' });
      if (!freshRes.ok) {
        throw new Error('Script deleted, but failed to reload updated list from server.');
      }
      const freshScripts = await freshRes.json();
      setScripts(freshScripts);

      setDeletingScript(null);
      showToast('Script deleted successfully', 'success', 3000, 'Permanently removed from storage');
      router.refresh();
    } catch (err: any) {
      showToast(err.message || 'Could not delete script.', 'error', 4000);
      throw err;
    }
  };

  const onLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <main className="min-h-screen pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-line bg-base/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
              <Zap className="h-4 w-4 text-black" />
            </span>
            <span className="font-display text-base font-semibold text-white">
              Nova Hub
              <span className="ml-2 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] font-normal text-zinc-300">
                Owner Dashboard
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/games"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors"
            >
              <span>View Public Hub</span>
              <ExternalLink size={12} />
            </Link>
            <button
              onClick={handleRunStorageDiagnostics}
              disabled={isRunningDiag}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-ink-muted transition-colors hover:border-white/30 hover:text-white disabled:opacity-50"
              title="Test isolated server-side write to Supabase Storage"
            >
              <Database size={13} className={isRunningDiag ? 'animate-spin' : ''} />
              {isRunningDiag ? 'Testing Storage...' : 'Test Storage'}
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3.5 py-1.5 text-xs text-ink-muted transition-colors hover:border-white/30 hover:text-white"
            >
              <LogOut size={13} />
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8">
        {/* Page Title & Main Action Buttons */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              Hub Administration
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              Manage your supported Roblox games, executors, and Luau script library.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Prominent ADD GAME Button */}
            <button
              id="add-game-btn"
              onClick={() => setEditingGame(null)}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black shadow-glow-sm hover:bg-zinc-200 transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>Add Game</span>
            </button>

            {/* ADD SCRIPT Button */}
            <button
              id="add-script-btn"
              onClick={() => setEditingScript(null)}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>Add Script</span>
            </button>
          </div>
        </div>

        {/* Tab switcher: Games vs Scripts */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setActiveTab('games');
                setQuery('');
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === 'games'
                  ? 'bg-white text-black shadow-sm'
                  : 'border border-line bg-surface/40 text-slate-300 hover:text-white'
              }`}
            >
              <Gamepad2 size={14} />
              <span>Supported Games</span>
              <span
                className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                  activeTab === 'games'
                    ? 'bg-black/10 text-black font-bold'
                    : 'bg-surface text-slate-400'
                }`}
              >
                {games.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('scripts');
                setQuery('');
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === 'scripts'
                  ? 'bg-white text-black shadow-sm'
                  : 'border border-line bg-surface/40 text-slate-300 hover:text-white'
              }`}
            >
              <FileCode2 size={14} />
              <span>Script Library</span>
              <span
                className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                  activeTab === 'scripts'
                    ? 'bg-black/10 text-black font-bold'
                    : 'bg-surface text-slate-400'
                }`}
              >
                {scripts.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('suggestions');
                setQuery('');
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'suggestions'
                  ? 'bg-white text-black shadow-sm'
                  : 'border border-line bg-surface/40 text-slate-300 hover:text-white'
              }`}
            >
              <MessageSquare size={14} />
              <span>Suggestions</span>
              {pendingSuggestionsCount > 0 ? (
                <span className="ml-1 inline-flex items-center rounded-full bg-amber-500/25 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/40 animate-pulse">
                  {pendingSuggestionsCount}
                </span>
              ) : (
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                    activeTab === 'suggestions'
                      ? 'bg-black/10 text-black font-bold'
                      : 'bg-surface text-slate-400'
                  }`}
                >
                  {suggestions.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('executions');
                setQuery('');
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'executions'
                  ? 'bg-white text-black shadow-sm'
                  : 'border border-line bg-surface/40 text-slate-300 hover:text-white'
              }`}
            >
              <Activity size={14} />
              <span>Execution Logs</span>
              <span
                className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                  activeTab === 'executions'
                    ? 'bg-black/10 text-black font-bold'
                    : 'bg-surface text-slate-400'
                }`}
              >
                {formatExecutionCount(initialAnalytics?.totalExecutions || 0)}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('changelog');
                setQuery('');
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'changelog'
                  ? 'bg-white text-black shadow-sm'
                  : 'border border-line bg-surface/40 text-slate-300 hover:text-white'
              }`}
            >
              <History size={14} />
              <span>Changelog</span>
              <span
                className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                  activeTab === 'changelog'
                    ? 'bg-black/10 text-black font-bold'
                    : 'bg-surface text-slate-400'
                }`}
              >
                {initialChangelog?.length || 0}
              </span>
            </button>
          </div>

          {/* Search bar (for Games & Scripts) */}
          {activeTab !== 'suggestions' && activeTab !== 'executions' && activeTab !== 'changelog' && (
            <div className="relative w-full sm:w-72">
              <Search
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  activeTab === 'games'
                    ? 'Search games by name or ID...'
                    : 'Search scripts by name or game...'
                }
                className="w-full rounded-xl border border-line bg-black/60 py-2 pl-9 pr-4 text-xs text-white placeholder:text-slate-400 focus:border-zinc-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* TAB 1: GAMES MANAGEMENT */}
        {activeTab === 'games' && (
          <div>
            {filteredGames.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line p-12 text-center">
                <Gamepad2 size={32} className="mx-auto text-slate-500 mb-3" />
                <h3 className="font-semibold text-white text-sm">No games found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {query
                    ? 'No games matched your search filter. Try another term.'
                    : 'Get started by adding your first Roblox game.'}
                </p>
                {!query && (
                  <button
                    onClick={() => setEditingGame(null)}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black shadow-sm hover:bg-zinc-200"
                  >
                    <Plus size={14} />
                    <span>Add Game</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Bulk actions bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface/30 px-4 py-2.5">
                  <div className="flex items-center gap-3 text-xs">
                    <label className="flex items-center gap-2 font-medium text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isAllGamesSelected}
                        onChange={toggleSelectAllGames}
                        className="h-4 w-4 rounded border-line bg-black/60 text-white accent-white focus:ring-0 cursor-pointer"
                        aria-label="Select all games"
                      />
                      <span>Select All</span>
                    </label>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={clearSelectedGames}
                      disabled={selectedGameSlugs.length === 0}
                      className="text-slate-400 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Clear Selection
                    </button>
                    {selectedGameSlugs.length > 0 && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white">
                        {selectedGameSlugs.length} selected
                      </span>
                    )}
                  </div>

                  {selectedGameSlugs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsBulkDeletingGames(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Delete Selected ({selectedGameSlugs.length})</span>
                    </button>
                  )}
                </div>

                <div className="overflow-hidden rounded-2xl border border-line bg-[#0c0c0f]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-line bg-surface/40 text-slate-400 uppercase tracking-wider text-[11px]">
                          <th className="w-10 px-4 py-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={isAllGamesSelected}
                              onChange={toggleSelectAllGames}
                              className="h-4 w-4 rounded border-line bg-black/60 text-white accent-white focus:ring-0 cursor-pointer"
                              aria-label="Select all games"
                            />
                          </th>
                          <th className="px-5 py-3.5 font-medium">Game Experience</th>
                          <th className="px-5 py-3.5 font-medium">Structured Features</th>
                          <th className="px-5 py-3.5 font-medium">Roblox IDs</th>
                          <th className="px-5 py-3.5 font-medium">URL Route</th>
                          <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/40">
                        {filteredGames.map((game) => {
                          const totalFeats = countGameFeatures(game);
                          const isSelected = selectedGameSlugs.includes(game.slug);
                          return (
                            <tr
                              key={game.slug}
                              className={`transition-colors ${isSelected ? 'bg-white/5' : 'hover:bg-surface/30'}`}
                            >
                              {/* Checkbox */}
                              <td className="w-10 px-4 py-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectGame(game.slug)}
                                  className="h-4 w-4 rounded border-line bg-black/60 text-white accent-white focus:ring-0 cursor-pointer"
                                  aria-label={`Select ${game.name}`}
                                />
                              </td>

                              {/* Game name & icon */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                {game.iconUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={game.iconUrl}
                                    alt={game.name}
                                    className="h-10 w-10 rounded-xl object-cover border border-line/60 flex-none"
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-line bg-surface/60 text-zinc-400">
                                    <ImageIcon size={18} />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-white text-sm truncate">
                                      {game.name}
                                    </span>
                                    {game.isUniversal && (
                                      <span className="rounded-full bg-zinc-800/80 border border-white/20 px-2 py-0.5 text-[10px] text-zinc-200 font-medium">
                                        Universal
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-400">
                                    {game.tabs?.length || 0} tabs configured
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Structured Features & Tabs */}
                            <td className="px-5 py-4">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-zinc-300">
                                    <Sparkles size={11} className="mr-1" />
                                    {totalFeats} features
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {game.tabs?.map((t) => (
                                    <span
                                      key={t.name}
                                      className="rounded-full border border-line/60 bg-black/40 px-2 py-0.5 text-[10px] text-slate-300"
                                    >
                                      {t.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </td>

                            {/* IDs */}
                            <td className="px-5 py-4 text-slate-300 font-mono text-[11px]">
                              {game.universeId ? (
                                <div className="space-y-0.5">
                                  <div>
                                    <span className="text-slate-400">Universe: </span>
                                    <span className="text-zinc-300">{game.universeId}</span>
                                  </div>
                                  {game.rootPlaceId && (
                                    <div>
                                      <span className="text-slate-400">Place: </span>
                                      <span className="text-slate-300">{game.rootPlaceId}</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400">None</span>
                              )}
                            </td>

                            {/* Route slug */}
                            <td className="px-5 py-4 font-mono text-[11px] text-slate-300">
                              <span className="rounded-md border border-line/60 bg-black/60 px-2 py-1 text-zinc-300">
                                /{game.slug}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link
                                  href={`/scripts?game=${game.slug}`}
                                  target="_blank"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-slate-400 hover:border-white/30 hover:text-white transition-colors"
                                  title="View expandable game card"
                                >
                                  <ExternalLink size={13} />
                                </Link>

                                <button
                                  onClick={() => setEditingGame(game)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-slate-400 hover:border-white/30 hover:text-white transition-colors"
                                  title="Edit Structured Features & Details"
                                >
                                  <Pencil size={13} />
                                </button>

                                <button
                                  onClick={() => setDeletingGame(game)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-slate-400 hover:border-red-800 hover:text-red-400 transition-colors"
                                  title="Delete Game"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

        {/* TAB 2: SCRIPTS MANAGEMENT */}
        {activeTab === 'scripts' && (
          <div>
            {/* Permanent Universal Loader Item */}
            <UniversalLoaderManager initialConfig={initialLoaderConfig} />

            {filteredScripts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line p-12 text-center">
                <FileCode2 size={32} className="mx-auto text-slate-500 mb-3" />
                <h3 className="font-semibold text-white text-sm">No scripts found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {query
                    ? 'No scripts matched your filter.'
                    : 'Add scripts and assign them to supported games.'}
                </p>
                {!query && (
                  <button
                    onClick={() => setEditingScript(null)}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black shadow-sm hover:bg-zinc-200"
                  >
                    <Plus size={14} />
                    <span>Add Script</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Bulk actions bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface/30 px-4 py-2.5">
                  <div className="flex items-center gap-3 text-xs">
                    <label className="flex items-center gap-2 font-medium text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isAllScriptsSelected}
                        onChange={toggleSelectAllScripts}
                        className="h-4 w-4 rounded border-line bg-black/60 text-white accent-white focus:ring-0 cursor-pointer"
                        aria-label="Select all scripts"
                      />
                      <span>Select All</span>
                    </label>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={clearSelectedScripts}
                      disabled={selectedScriptSlugs.length === 0}
                      className="text-slate-400 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Clear Selection
                    </button>
                    {selectedScriptSlugs.length > 0 && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white">
                        {selectedScriptSlugs.length} selected
                      </span>
                    )}
                  </div>

                  {selectedScriptSlugs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsBulkDeletingScripts(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Delete Selected ({selectedScriptSlugs.length})</span>
                    </button>
                  )}
                </div>

                <div className="overflow-hidden rounded-2xl border border-line bg-[#0c0c0f]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-line bg-surface/40 text-slate-400 uppercase tracking-wider text-[11px]">
                          <th className="w-10 px-4 py-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={isAllScriptsSelected}
                              onChange={toggleSelectAllScripts}
                              className="h-4 w-4 rounded border-line bg-black/60 text-white accent-white focus:ring-0 cursor-pointer"
                              aria-label="Select all scripts"
                            />
                          </th>
                          <th className="px-5 py-3.5 font-medium">Script</th>
                          <th className="px-5 py-3.5 font-medium">Assigned Game</th>
                          <th className="px-5 py-3.5 font-medium">Category</th>
                          <th className="px-5 py-3.5 font-medium">Version</th>
                          <th className="px-5 py-3.5 font-medium">Updated</th>
                          <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/40">
                        {filteredScripts.map((script) => {
                          const matchedGame = games.find(
                            (g) => g.slug.toLowerCase() === script.game.toLowerCase()
                          );
                          const isSelected = selectedScriptSlugs.includes(script.slug);
                          return (
                            <tr
                              key={script.slug}
                              className={`transition-colors ${isSelected ? 'bg-white/5' : 'hover:bg-surface/30'}`}
                            >
                              {/* Checkbox */}
                              <td className="w-10 px-4 py-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectScript(script.slug)}
                                  className="h-4 w-4 rounded border-line bg-black/60 text-white accent-white focus:ring-0 cursor-pointer"
                                  aria-label={`Select ${script.name}`}
                                />
                              </td>

                              <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-line bg-surface/60 text-zinc-300">
                                  <Icon name={script.icon} size={15} />
                                </span>
                                <span className="font-semibold text-white">
                                  {script.name}
                                </span>
                              </div>
                            </td>

                            {/* Assigned Game */}
                            <td className="px-5 py-4">
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-line/60 bg-black/60 px-2.5 py-1 text-[11px] text-slate-300">
                                <Gamepad2 size={11} className="text-zinc-400" />
                                <span>{matchedGame?.name || script.game || 'Universal'}</span>
                              </span>
                            </td>

                            <td className="px-5 py-4 text-slate-300">
                              {script.category}
                            </td>

                            <td className="px-5 py-4 text-slate-300 font-mono">
                              v{script.version}
                            </td>

                            <td className="px-5 py-4 text-slate-400">
                              {script.updatedAt}
                            </td>

                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleCopyRawUrl(script.slug)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-slate-400 hover:border-white/30 hover:text-white transition-colors cursor-pointer"
                                  title={`Copy Raw URL (https://novahub.vercel.app/raw/${script.slug})`}
                                  aria-label="Copy Raw URL"
                                >
                                  {copiedRawSlug === script.slug ? (
                                    <Check size={13} className="text-emerald-400" />
                                  ) : (
                                    <Copy size={13} />
                                  )}
                                </button>
                                <Link
                                  href={`/scripts/${script.slug}`}
                                  target="_blank"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-slate-400 hover:border-white/30 hover:text-white transition-colors"
                                  title="View public page"
                                >
                                  <ExternalLink size={13} />
                                </Link>
                                <button
                                  onClick={() => setEditingScript(script)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-slate-400 hover:border-white/30 hover:text-white transition-colors"
                                  title="Edit script"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={() => setDeletingScript(script)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-slate-400 hover:border-red-800 hover:text-red-400 transition-colors cursor-pointer"
                                  title="Delete script"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

        {/* TAB 3: SUGGESTIONS MANAGEMENT */}
        {activeTab === 'suggestions' && (
          <SuggestionsTab
            initialSuggestions={suggestions}
            onSuggestionsUpdated={(fresh) => setSuggestions(fresh)}
          />
        )}

        {/* TAB 4: EXECUTION LOGS & TELEMETRY */}
        {activeTab === 'executions' && (
          <ExecutionLogsTab
            initialAnalytics={initialAnalytics}
            initialLogs={initialExecutionLogs}
          />
        )}

        {/* TAB 5: CHANGELOG MANAGEMENT */}
        {activeTab === 'changelog' && (
          <ChangelogManager initialReleases={initialChangelog} />
        )}
      </div>

      {/* Script Form Modal (Create or Edit) */}
      {editingScript !== undefined && (
        <ScriptFormModal
          script={editingScript}
          games={games}
          onClose={() => setEditingScript(undefined)}
          onSaved={onScriptSaved}
        />
      )}

      {/* Delete Script Confirmation Modal */}
      {deletingScript && (
        <DeleteScriptModal
          script={deletingScript}
          onClose={() => setDeletingScript(null)}
          onConfirmed={onScriptDeleteConfirmed}
        />
      )}

      {/* Game Form Modal (Create or Edit) */}
      {editingGame !== undefined && (
        <GameFormModal
          game={editingGame}
          onClose={() => setEditingGame(undefined)}
          onSaved={onGameSaved}
        />
      )}

      {/* Delete Game Confirmation Modal */}
      {deletingGame && (
        <DeleteGameModal
          game={deletingGame}
          associatedScriptCount={scriptsCountByGame[deletingGame.slug.toLowerCase()] || 0}
          onClose={() => setDeletingGame(null)}
          onConfirmed={onGameDeleteConfirmed}
        />
      )}

      {/* Bulk Delete Games Confirmation Modal */}
      {isBulkDeletingGames && (
        <BulkDeleteModal
          type="games"
          count={selectedGameSlugs.length}
          onClose={() => setIsBulkDeletingGames(false)}
          onConfirm={handleBulkDeleteGamesConfirm}
        />
      )}

      {/* Bulk Delete Scripts Confirmation Modal */}
      {isBulkDeletingScripts && (
        <BulkDeleteModal
          type="scripts"
          count={selectedScriptSlugs.length}
          onClose={() => setIsBulkDeletingScripts(false)}
          onConfirm={handleBulkDeleteScriptsConfirm}
        />
      )}

      {/* Storage Diagnostics Modal */}
      {diagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-line bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Database size={18} className="text-white" />
                <h3 className="font-semibold text-white">Supabase Storage Diagnostics</h3>
              </div>
              <button
                onClick={() => setDiagModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            {diagReport && (
              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-line bg-surface-raised p-3 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Environment:</span>
                    <span className="font-mono text-white">{diagReport.environment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Bucket:</span>
                    <span className="font-mono text-white">{diagReport.bucketJson || JSON.stringify(diagReport.bucket)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Overall Status:</span>
                    <span className={`font-semibold ${diagReport.overallSuccess ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {diagReport.overallSuccess ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                </div>

                {/* Step 1: Root write test */}
                <div className="rounded-xl border border-line bg-surface-raised p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">Step 1: Root Path Test</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      diagReport.step1RootTest?.writeSuccess ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {diagReport.step1RootTest?.writeSuccess ? 'WRITE OK' : 'FAILED'}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-400">
                    Path: {diagReport.step1RootTest?.path}
                  </div>
                  {diagReport.step1RootTest?.error && (
                    <div className="mt-1 text-rose-400 font-mono text-[11px] break-all">
                      Error [{diagReport.step1RootTest.error.statusCode || 'N/A'}]: {diagReport.step1RootTest.error.message}
                    </div>
                  )}
                  {diagReport.step1RootTest?.writeSuccess && (
                    <div className="text-[11px] text-slate-300">
                      Write: OK | Readback: {diagReport.step1RootTest.readMatches ? 'OK' : 'MISMATCH'} | Delete: {diagReport.step1RootTest.deleteSuccess ? 'CLEANED' : 'PENDING'}
                    </div>
                  )}
                </div>

                {/* Step 2: Nested path test */}
                {diagReport.step2NestedTest && (
                  <div className="rounded-xl border border-line bg-surface-raised p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">Step 2: Nested nova-hub/ Prefix Test</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        diagReport.step2NestedTest.writeSuccess ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {diagReport.step2NestedTest.writeSuccess ? 'WRITE OK' : 'FAILED'}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-400">
                      Path: {diagReport.step2NestedTest.path}
                    </div>
                    {diagReport.step2NestedTest.error && (
                      <div className="mt-1 text-rose-400 font-mono text-[11px] break-all">
                        Error [{diagReport.step2NestedTest.error.statusCode || 'N/A'}]: {diagReport.step2NestedTest.error.message}
                      </div>
                    )}
                    {diagReport.step2NestedTest.writeSuccess && (
                      <div className="text-[11px] text-slate-300">
                        Write: OK | Readback: {diagReport.step2NestedTest.readMatches ? 'OK' : 'MISMATCH'} | Delete: {diagReport.step2NestedTest.deleteSuccess ? 'CLEANED' : 'PENDING'}
                      </div>
                    )}
                  </div>
                )}

                <div className="p-3 rounded-xl bg-white/5 text-slate-300 text-[11px] leading-relaxed">
                  {diagReport.summary}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDiagModalOpen(false)}
                className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
