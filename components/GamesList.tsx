'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { RobloxGame } from '@/lib/games';
import { GameCard } from './GameCard';
import { Reveal } from './Reveal';

interface GamesListProps {
  games: RobloxGame[];
  scriptCounts: Record<string, number>;
}

export function GamesList({ games, scriptCounts }: GamesListProps) {
  const [query, setQuery] = useState('');
  const [playerCounts, setPlayerCounts] = useState<Record<string, number | null>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const universeIds = useMemo(() => {
    return games
      .map((g) => g.universeId)
      .filter((id): id is number => typeof id === 'number' && id > 0);
  }, [games]);

  const fetchPlayerCounts = useCallback(async () => {
    if (universeIds.length === 0) return;
    setStatus((prev) => (prev === 'idle' ? 'loading' : prev));

    try {
      const res = await fetch(
        `/api/roblox/games?universeIds=${universeIds.join(',')}`,
        { cache: 'no-store' }
      );
      if (!res.ok) {
        throw new Error('Failed to fetch player counts');
      }
      const json = await res.json();
      if (json.success && json.data) {
        const counts: Record<string, number | null> = {};
        for (const [id, val] of Object.entries(json.data as Record<string, { playing: number | null }>)) {
          counts[id] = val?.playing ?? null;
        }
        setPlayerCounts(counts);
        setStatus('success');
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }, [universeIds]);

  // Initial fetch and periodic refresh every 45s
  useEffect(() => {
    fetchPlayerCounts();
    const interval = setInterval(fetchPlayerCounts, 45000);
    return () => clearInterval(interval);
  }, [fetchPlayerCounts]);

  const filteredGames = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return games;
    return games.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.slug.toLowerCase().includes(q)
    );
  }, [games, query]);

  return (
    <section className="mx-auto max-w-4xl px-4 pt-28 pb-20 sm:px-6 sm:pt-32 sm:pb-28">
      <Reveal>
        <div className="mb-8 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Supported Games
            </h1>
            <p className="mt-1.5 max-w-lg text-sm text-slate-300">
              Click a game to expand its features and tabs.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search game..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-line/80 bg-[#0a122e]/80 py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-400 outline-none transition-all focus:border-azure-500 focus:bg-[#0c163a] focus:ring-1 focus:ring-azure-500"
            />
          </div>
        </div>

        {/* Live Status Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line/50 bg-[#070e28]/70 px-4 py-2.5 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="font-medium text-slate-200">
              Roblox Live Status: Operational
            </span>
            {lastUpdated && (
              <span className="text-slate-400">
                • Refreshed at {lastUpdated}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fetchPlayerCounts()}
            className="inline-flex items-center gap-1.5 text-xs text-azure-300 hover:text-white transition-colors"
          >
            <RefreshCw size={11} className={status === 'loading' ? 'animate-spin' : ''} />
            <span>Refresh counts</span>
          </button>
        </div>
      </Reveal>

      {/* Horizontal Game Cards List */}
      <div className="space-y-3 sm:space-y-3.5">
        {filteredGames.length > 0 ? (
          filteredGames.map((game, idx) => {
            const count = game.universeId ? playerCounts[String(game.universeId)] : null;
            const scriptsCount = scriptCounts[game.slug] ?? 0;

            return (
              <Reveal key={game.slug} delay={idx * 35}>
                <GameCard
                  game={game}
                  scriptsCount={scriptsCount}
                  playerCount={count}
                  playerCountStatus={status === 'loading' && count === undefined ? 'loading' : status === 'error' && count === undefined ? 'error' : 'success'}
                />
              </Reveal>
            );
          })
        ) : (
          <div className="rounded-2xl border border-line/60 bg-[#08102d]/70 p-10 text-center">
            <p className="text-sm text-slate-300">
              No games found matching &ldquo;{query}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-azure-500/30 bg-azure-500/10 px-3 py-1.5 text-xs font-medium text-azure-300 hover:bg-azure-500/20"
            >
              Clear search
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
