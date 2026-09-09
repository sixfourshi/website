'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { ArrowRight, ChevronRight, Layers, Play } from 'lucide-react';
import { RobloxGame, formatPlayerCount } from '@/lib/games';

interface GameCardProps {
  game: RobloxGame;
  scriptsCount: number;
  playerCount?: number | null;
  playerCountStatus?: 'loading' | 'success' | 'error';
}

export function GameCard({
  game,
  scriptsCount,
  playerCount,
  playerCountStatus = 'success',
}: GameCardProps) {
  const [imgError, setImgError] = useState(false);
  const [thumbError, setThumbError] = useState(false);

  // Player count display logic
  let playerDisplay = 'Unavailable';
  if (game.isUniversal) {
    playerDisplay = 'All Experiences';
  } else if (playerCountStatus === 'loading') {
    playerDisplay = 'Fetching...';
  } else if (playerCountStatus === 'error' || playerCount === null || playerCount === undefined) {
    playerDisplay = 'Unavailable';
  } else {
    playerDisplay = `${formatPlayerCount(playerCount)} playing`;
  }

  return (
    <Link
      href={`/scripts/${game.slug}`}
      className="group relative block w-full overflow-hidden rounded-2xl border border-line/75 bg-[#08102d]/80 transition-all duration-300 hover:-translate-y-0.5 hover:border-azure-500/60 hover:shadow-xl hover:shadow-azure-950/40"
    >
      {/* Subtle, darkened thumbnail backdrop */}
      {!thumbError && game.thumbnailUrl ? (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20 transition-transform duration-700 ease-out group-hover:scale-105"
            style={{ backgroundImage: `url(${game.thumbnailUrl})` }}
          />
          {/* Dark-blue overlay gradient to preserve theme & typography contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#060b1e]/96 via-[#07102e]/90 to-[#0a153d]/92" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-[#08102d]/90 pointer-events-none" />
      )}

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        {/* Left: Icon + Info */}
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Game Icon */}
          <div className="relative h-13 w-13 sm:h-14 sm:w-14 flex-none overflow-hidden rounded-xl border border-line/90 bg-[#050a1a] shadow-md transition-transform duration-300 group-hover:scale-[1.03]">
            {!imgError && game.iconUrl ? (
              <Image
                src={game.iconUrl}
                alt={game.name}
                fill
                sizes="56px"
                className="object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0c1a44] to-[#060c22] text-azure-300">
                <Layers size={22} />
              </div>
            )}
          </div>

          {/* Game Name & Status / Live Player Count */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2 flex-none items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <h3 className="truncate font-display text-base font-bold text-white tracking-tight sm:text-lg">
                {game.name}
              </h3>
            </div>

            <div className="mt-1 flex items-center gap-2">
              <p className="text-xs sm:text-sm font-medium text-emerald-400">
                {playerDisplay}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Available scripts count pill + View scripts button */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t border-line/40 sm:border-t-0">
          {/* Feature / Script Count Pill */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line/80 bg-[#0d173c]/70 px-3 py-1 text-xs font-medium text-slate-300">
            <span className="text-azure-300 font-semibold">{scriptsCount}</span>
            <span>{scriptsCount === 1 ? 'script' : 'scripts'}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">{game.featuresCount} features</span>
          </span>

          {/* View Scripts Action */}
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-azure-500/40 bg-azure-500/15 px-3.5 py-1.5 text-xs font-semibold text-azure-200 transition-all duration-200 group-hover:border-azure-400 group-hover:bg-azure-500 group-hover:text-white group-hover:shadow-glow-sm">
              <Play size={10} className="fill-current text-azure-300 group-hover:text-white" />
              <span>View scripts</span>
              <ArrowRight
                size={13}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </span>
            <ChevronRight
              size={16}
              className="hidden sm:block text-slate-500 transition-colors group-hover:text-azure-300"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
