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
} from 'lucide-react';
import { Icon } from './Icon';
import { showToast } from './Toast';
import { ScriptFormModal } from './ScriptFormModal';
import { GameFormModal } from './GameFormModal';
import { DeleteGameModal } from './DeleteGameModal';
import type { Script } from '@/lib/scripts';
import type { RobloxGame } from '@/lib/games';

export function DashboardClient({
  initialScripts,
  initialGames,
}: {
  initialScripts: Script[];
  initialGames: RobloxGame[];
}) {
  const router = useRouter();
  const [scripts, setScripts] = useState<Script[]>(initialScripts);
  const [games, setGames] = useState<RobloxGame[]>(initialGames);

  const [activeTab, setActiveTab] = useState<'games' | 'scripts'>('games');
  const [query, setQuery] = useState('');

  // Script modals
  const [editingScript, setEditingScript] = useState<Script | null | undefined>(undefined);
  const [deletingScriptSlug, setDeletingScriptSlug] = useState<string | null>(null);

  // Game modals
  const [editingGame, setEditingGame] = useState<RobloxGame | null | undefined>(undefined);
  const [deletingGame, setDeletingGame] = useState<RobloxGame | null>(null);

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

  // Handle Script Delete
  const onScriptDelete = async (slug: string) => {
    setDeletingScriptSlug(slug);
    try {
      const res = await fetch(`/api/scripts/${slug}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete script.');
      }

      try {
        const freshRes = await fetch('/api/scripts', { cache: 'no-store' });
        if (freshRes.ok) {
          setScripts(await freshRes.json());
        } else {
          setScripts((prev) => prev.filter((s) => s.slug !== slug));
        }
      } catch {
        setScripts((prev) => prev.filter((s) => s.slug !== slug));
      }

      showToast('Script deleted successfully', 'success', 3000, 'Removed from library');
      router.refresh();
    } catch (err: any) {
      showToast(err.message || 'Could not delete script.', 'error', 4000);
    } finally {
      setDeletingScriptSlug(null);
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
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-azure-400 to-azure-700 shadow-glow-sm">
              <Zap className="h-4 w-4 text-white" />
            </span>
            <span className="font-display text-base font-semibold text-white">
              Sour Hub
              <span className="ml-2 rounded-full border border-azure-500/40 bg-azure-950/60 px-2 py-0.5 text-[11px] font-normal text-azure-300">
                Owner Dashboard
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/scripts"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors"
            >
              <span>View Public Hub</span>
              <ExternalLink size={12} />
            </Link>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3.5 py-1.5 text-xs text-ink-muted transition-colors hover:border-azure-700 hover:text-ink"
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
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-azure-600 to-cyan-500 px-4 py-2.5 text-xs font-semibold text-white shadow-glow-sm hover:from-azure-500 hover:to-cyan-400 transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>Add Game</span>
            </button>

            {/* ADD SCRIPT Button */}
            <button
              id="add-script-btn"
              onClick={() => setEditingScript(null)}
              className="flex items-center gap-2 rounded-xl border border-azure-500/50 bg-azure-950/40 px-4 py-2.5 text-xs font-semibold text-azure-200 hover:bg-azure-900/60 hover:text-white transition-all cursor-pointer"
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
                  ? 'bg-azure-500 text-white shadow-glow-sm'
                  : 'border border-line bg-surface/40 text-slate-300 hover:text-white'
              }`}
            >
              <Gamepad2 size={14} />
              <span>Supported Games</span>
              <span
                className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                  activeTab === 'games'
                    ? 'bg-white/20 text-white'
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
                  ? 'bg-azure-500 text-white shadow-glow-sm'
                  : 'border border-line bg-surface/40 text-slate-300 hover:text-white'
              }`}
            >
              <FileCode2 size={14} />
              <span>Script Library</span>
              <span
                className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                  activeTab === 'scripts'
                    ? 'bg-white/20 text-white'
                    : 'bg-surface text-slate-400'
                }`}
              >
                {scripts.length}
              </span>
            </button>
          </div>

          {/* Search bar */}
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
              className="w-full rounded-xl border border-line bg-[#060b1e] py-2 pl-9 pr-4 text-xs text-white placeholder:text-slate-400 focus:border-azure-500 focus:outline-none"
            />
          </div>
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
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-azure-500 px-4 py-2 text-xs font-medium text-white shadow-glow-sm hover:bg-azure-400"
                  >
                    <Plus size={14} />
                    <span>Add Game</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-line bg-[#070e24]/60">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-line bg-surface/40 text-slate-400 uppercase tracking-wider text-[11px]">
                        <th className="px-5 py-3.5 font-medium">Game Experience</th>
                        <th className="px-5 py-3.5 font-medium">Roblox IDs</th>
                        <th className="px-5 py-3.5 font-medium">URL Route</th>
                        <th className="px-5 py-3.5 font-medium text-center">Scripts</th>
                        <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/40">
                      {filteredGames.map((game) => {
                        const count = scriptsCountByGame[game.slug.toLowerCase()] || 0;
                        return (
                          <tr
                            key={game.slug}
                            className="hover:bg-surface/30 transition-colors"
                          >
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
                                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-line bg-surface/60 text-azure-400">
                                    <ImageIcon size={18} />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-white text-sm truncate">
                                      {game.name}
                                    </span>
                                    {game.isUniversal && (
                                      <span className="rounded-full bg-cyan-950/60 border border-cyan-500/40 px-2 py-0.5 text-[10px] text-cyan-300 font-medium">
                                        Universal
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-400 line-clamp-1 max-w-sm mt-0.5">
                                    {game.description || 'No description provided.'}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* IDs */}
                            <td className="px-5 py-4 text-slate-300 font-mono text-[11px]">
                              {game.universeId ? (
                                <div className="space-y-0.5">
                                  <div>
                                    <span className="text-slate-400">Universe: </span>
                                    <span className="text-azure-300">{game.universeId}</span>
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
                              <span className="rounded-md border border-line/60 bg-[#060b1e] px-2 py-1 text-azure-300">
                                /{game.slug}
                              </span>
                            </td>

                            {/* Associated scripts count */}
                            <td className="px-5 py-4 text-center">
                              <span className="inline-flex items-center gap-1 rounded-full border border-azure-500/30 bg-azure-950/40 px-2.5 py-0.5 text-[11px] font-medium text-azure-300">
                                <Layers size={11} />
                                <span>{count}</span>
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link
                                  href={`/scripts/${game.slug}`}
                                  target="_blank"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-slate-400 hover:border-azure-600 hover:text-white transition-colors"
                                  title="View public game page"
                                >
                                  <ExternalLink size={13} />
                                </Link>

                                <button
                                  onClick={() => setEditingGame(game)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-slate-400 hover:border-azure-600 hover:text-white transition-colors"
                                  title="Edit Game"
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
            )}
          </div>
        )}

        {/* TAB 2: SCRIPTS MANAGEMENT */}
        {activeTab === 'scripts' && (
          <div>
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
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-azure-500 px-4 py-2 text-xs font-medium text-white shadow-glow-sm hover:bg-azure-400"
                  >
                    <Plus size={14} />
                    <span>Add Script</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-line bg-[#070e24]/60">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-line bg-surface/40 text-slate-400 uppercase tracking-wider text-[11px]">
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
                        return (
                          <tr
                            key={script.slug}
                            className="hover:bg-surface/30 transition-colors"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-line bg-surface/60 text-azure-300">
                                  <Icon name={script.icon} size={15} />
                                </span>
                                <span className="font-semibold text-white">
                                  {script.name}
                                </span>
                              </div>
                            </td>

                            {/* Assigned Game */}
                            <td className="px-5 py-4">
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-line/60 bg-[#060b1e] px-2.5 py-1 text-[11px] text-slate-300">
                                <Gamepad2 size={11} className="text-azure-400" />
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
                                <Link
                                  href={`/scripts/${script.slug}`}
                                  target="_blank"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-slate-400 hover:border-azure-600 hover:text-white transition-colors"
                                  title="View public page"
                                >
                                  <ExternalLink size={13} />
                                </Link>
                                <button
                                  onClick={() => setEditingScript(script)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-slate-400 hover:border-azure-600 hover:text-white transition-colors"
                                  title="Edit script"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={() => onScriptDelete(script.slug)}
                                  disabled={deletingScriptSlug === script.slug}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-slate-400 hover:border-red-800 hover:text-red-400 disabled:opacity-50 transition-colors"
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
            )}
          </div>
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
    </main>
  );
}
