'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { ChevronDown, Layers, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RobloxGame, formatPlayerCount, countGameFeatures } from '@/lib/games';

interface GameCardProps {
  game: RobloxGame;
  isExpanded: boolean;
  onToggle: () => void;
  playerCount?: number | null;
  playerCountStatus?: 'loading' | 'success' | 'error';
}

export function GameCard({
  game,
  isExpanded,
  onToggle,
  playerCount,
  playerCountStatus = 'success',
}: GameCardProps) {
  const [imgError, setImgError] = useState(false);
  const [thumbError, setThumbError] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Automatically select the first tab when a game is expanded
  useEffect(() => {
    if (isExpanded) {
      setActiveTabIndex(0);
    }
  }, [isExpanded]);

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

  const playUrl = game.rootPlaceId
    ? `https://www.roblox.com/games/${game.rootPlaceId}`
    : game.universeId
    ? `https://www.roblox.com/games/${game.universeId}`
    : 'https://www.roblox.com/discover';

  const totalFeatures = countGameFeatures(game);
  const tabs = Array.isArray(game.tabs) && game.tabs.length > 0 ? game.tabs : [];
  const currentTab = tabs[activeTabIndex] || tabs[0];

  return (
    <div
      id={`game-card-${game.slug}`}
      className={`group relative w-full overflow-hidden rounded-2xl border transition-all duration-300 ${
        isExpanded
          ? 'border-azure-500/60 bg-[#070e28] shadow-lg shadow-azure-950/40'
          : 'border-line/75 bg-[#08102d]/80 hover:border-azure-500/40 hover:bg-[#091232]'
      }`}
    >
      {/* Roblox Artwork Background Banner (right-side aligned with soft gradient) */}
      {!thumbError && game.thumbnailUrl ? (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div
            className="absolute -right-6 -top-10 bottom-0 w-2/3 sm:w-1/2 bg-cover bg-right opacity-25 transition-transform duration-700 ease-out group-hover:scale-105"
            style={{ backgroundImage: `url(${game.thumbnailUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#060b1e] via-[#07102e]/95 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060b1e]/90 via-transparent to-transparent" />
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-0 z-0 bg-[#08102d]/90" />
      )}

      {/* Card Header (Clicking expands/collapses the card) */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        className="relative z-10 flex cursor-pointer flex-col gap-3.5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 select-none"
      >
        {/* Left: Game Icon + Name + Live Player Count */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative h-13 w-13 sm:h-14 sm:w-14 flex-none overflow-hidden rounded-xl border border-line/90 bg-[#050a1a] shadow-md transition-transform duration-300 group-hover:scale-[1.02]">
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

        {/* Right: Total feature count pill + Play button + Arrow Toggle */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t border-line/40 sm:border-t-0">
          {/* Feature Count Pill */}
          <span className="inline-flex items-center rounded-full border border-azure-500/30 bg-[#0c163b]/90 px-3 py-1 text-xs font-medium text-slate-300 shadow-sm">
            <span className="font-semibold text-azure-300 mr-1">{totalFeatures}</span>
            features
          </span>

          {/* Play Button (Opens Roblox, does NOT toggle card) */}
          <a
            href={playUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-azure-500/40 bg-azure-500/20 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:border-azure-400 hover:bg-azure-500 hover:shadow-glow-sm"
          >
            <Play size={10} className="fill-current text-white" />
            <span>Play</span>
          </a>

          {/* Arrow / Chevron */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors group-hover:text-white">
            <ChevronDown
              size={18}
              className={`transition-transform duration-300 ease-out ${
                isExpanded ? 'rotate-180 text-azure-300' : 'text-slate-400'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Smoothly Animated Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="card-expanded-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 border-t border-line/60 bg-[#060c24]/90 px-4 sm:px-6 pt-4 pb-6"
            >
              {/* Tabs Row */}
              {tabs.length > 0 ? (
                <div>
                  <div className="flex flex-wrap items-center gap-2 pb-4">
                    {tabs.map((tab, idx) => {
                      const isActive = activeTabIndex === idx;
                      return (
                        <button
                          key={tab.name + idx}
                          type="button"
                          onClick={() => setActiveTabIndex(idx)}
                          className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                            isActive
                              ? 'border border-azure-400 bg-azure-500/25 text-white shadow-glow-sm font-semibold'
                              : 'border border-line/70 bg-[#091330]/90 text-slate-400 hover:border-azure-500/40 hover:text-slate-200'
                          }`}
                        >
                          {tab.name}
                        </button>
                      );
                    })}
                  </div>

                  {/* Sections & Features inside selected Tab */}
                  {currentTab && Array.isArray(currentTab.sections) && currentTab.sections.length > 0 ? (
                    <motion.div
                      key={currentTab.name + activeTabIndex}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-4 pt-1"
                    >
                      {currentTab.sections.map((section, sIdx) => (
                        <div key={section.name + sIdx} className="space-y-2">
                          <h4 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                            {section.name}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(section.features) && section.features.length > 0 ? (
                              section.features.map((feat, fIdx) => (
                                <span
                                  key={feat + fIdx}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-azure-500/20 bg-[#0a1538]/90 px-3 py-1 text-xs text-slate-200 shadow-sm transition-colors hover:border-azure-400/40 hover:text-white"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-azure-400 flex-none" />
                                  <span>{feat}</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-500 italic">No features listed</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No sections or features found in this tab.
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No feature tabs configured for this game yet.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
