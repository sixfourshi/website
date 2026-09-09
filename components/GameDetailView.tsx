'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ExternalLink,
  Layers,
  Sparkles,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { RobloxGame, formatPlayerCount } from '@/lib/games';
import { Script } from '@/lib/scripts';
import { CompactScriptCard } from './CompactScriptCard';
import { Reveal } from './Reveal';

interface GameDetailViewProps {
  game: RobloxGame;
  scripts: Script[];
}

export function GameDetailView({ game, scripts }: GameDetailViewProps) {
  const [playerCount, setPlayerCount] = useState<number | null | undefined>(undefined);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [imgError, setImgError] = useState(false);
  const [thumbError, setThumbError] = useState(false);

  const fetchCount = useCallback(async () => {
    if (!game.universeId || game.isUniversal) {
      setPlayerCount(null);
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch(`/api/roblox/games?universeIds=${game.universeId}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      if (json.success && json.data && json.data[String(game.universeId)]) {
        setPlayerCount(json.data[String(game.universeId)].playing);
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }, [game.universeId, game.isUniversal]);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 45000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  // Format player count
  let playerDisplay = 'Unavailable';
  if (game.isUniversal) {
    playerDisplay = 'All Experiences';
  } else if (status === 'loading' && playerCount === undefined) {
    playerDisplay = 'Fetching...';
  } else if (status === 'error' || playerCount === null || playerCount === undefined) {
    playerDisplay = 'Unavailable';
  } else {
    playerDisplay = `${formatPlayerCount(playerCount)} playing`;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pt-28 pb-20 sm:px-6 sm:pt-32 sm:pb-24">
      {/* Back Link */}
      <Reveal>
        <Link
          href="/scripts"
          className="group mb-6 inline-flex items-center gap-2 text-xs font-semibold text-azure-300 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          <span>Back to all games</span>
        </Link>
      </Reveal>

      {/* Game Hero Card */}
      <Reveal delay={40}>
        <div className="relative mb-8 overflow-hidden rounded-2xl border border-line/80 bg-[#08102d]/90 shadow-xl">
          {/* Darkened Game Thumbnail Backdrop */}
          {!thumbError && game.thumbnailUrl ? (
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-25"
                style={{ backgroundImage: `url(${game.thumbnailUrl})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#060b1e]/96 via-[#07102e]/92 to-[#09153d]/94" />
            </div>
          ) : (
            <div className="absolute inset-0 z-0 bg-[#08102d]/90 pointer-events-none" />
          )}

          {/* Hero Content */}
          <div className="relative z-10 p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              {/* Game Icon */}
              <div className="relative h-20 w-20 flex-none overflow-hidden rounded-2xl border border-line/90 bg-[#050a1a] shadow-lg sm:h-24 sm:w-24">
                {!imgError && game.iconUrl ? (
                  <Image
                    src={game.iconUrl}
                    alt={game.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0c1a44] to-[#060c22] text-azure-300">
                    <Layers size={32} />
                  </div>
                )}
              </div>

              {/* Game Details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
                    {game.name}
                  </h1>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
                    Verified
                  </span>
                </div>

                {/* Subtitle / Player count */}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                  <span className="font-semibold text-emerald-400">
                    {playerDisplay}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300">
                    {scripts.length} {scripts.length === 1 ? 'script available' : 'scripts available'}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="inline-flex items-center gap-1 text-azure-300">
                    <ShieldCheck size={13} />
                    100% Keyless
                  </span>
                </div>

                <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-300 max-w-2xl">
                  {game.description}
                </p>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {game.rootPlaceId && (
                    <a
                      href={`https://www.roblox.com/games/${game.rootPlaceId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-line/80 bg-[#0c163a] px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:border-azure-500/50 hover:text-white transition-colors"
                    >
                      <span>Play on Roblox</span>
                      <ExternalLink size={12} />
                    </a>
                  )}

                  {!game.isUniversal && (
                    <button
                      type="button"
                      onClick={() => fetchCount()}
                      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-azure-300 transition-colors"
                    >
                      <RefreshCw size={11} className={status === 'loading' ? 'animate-spin' : ''} />
                      <span>Refresh count</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Available Scripts Section */}
      <Reveal delay={80}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-azure-400" />
            <h2 className="font-display text-lg font-bold text-white tracking-tight sm:text-xl">
              Available Scripts
            </h2>
            <span className="rounded-full border border-line/80 bg-[#08102d] px-2.5 py-0.5 text-xs font-semibold text-azure-300">
              {scripts.length}
            </span>
          </div>
        </div>
      </Reveal>

      {/* Compact Script Cards */}
      <div className="space-y-4">
        {scripts.length > 0 ? (
          scripts.map((script, idx) => (
            <Reveal key={script.slug} delay={100 + idx * 40}>
              <CompactScriptCard script={script} />
            </Reveal>
          ))
        ) : (
          <div className="rounded-2xl border border-line/60 bg-[#08102d]/70 p-10 text-center">
            <p className="text-sm text-slate-300">
              No scripts are currently cataloged for this game. Check back soon for new updates!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
