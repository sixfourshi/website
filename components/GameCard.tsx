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
          ? 'border-azure-400/60 bg-[#0b1739] shadow-xl shadow-azure-950/50 ring-1 ring-azure-400/20'
          : 'border-azure-500/30 bg-[#0c183d] hover:border-azure-400/60 shadow-md hover:shadow-lg hover:shadow-azure-950/40'
      }`}
    >
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
        className="relative overflow-hidden cursor-pointer select-none"
      >
        {/* Roblox Artwork Background Banner across full width & height of the header */}
        {game.thumbnailUrl && !thumbError ? (
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              style={{
                backgroundImage: `url(${game.thumbnailUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
              }}
            />
            {/* Lighter transparent dark-blue gradient overlay to keep text readable without hiding artwork */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#09153a]/75 via-[#0b1c48]/55 to-[#09153a]/70" />
            <div className="absolute inset-0 bg-[#081232]/20" />
          </div>
        ) : (
          <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-[#0e1d48] via-[#12255c] to-[#0e1d48]" />
        )}

        {/* Header Content */}
        <div className="relative z-10 flex flex-col gap-3.5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          {/* Left: Game Icon + Name + Live Player Count */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative h-13 w-13 sm:h-14 sm:w-14 flex-none overflow-hidden rounded-xl border border-azure-400/40 bg-[#0d1a40] shadow-lg shadow-black/40 ring-1 ring-white/15 transition-transform duration-300 group-hover:scale-[1.04]">
              {!imgError && game.iconUrl ? (
                <Image
                  src={game.iconUrl}
                  alt={game.name}
                  fill
                  sizes="56px"
                  unoptimized
                  referrerPolicy="no-referrer"
                  className="object-cover brightness-105 contrast-105"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#12245c] to-[#0c183a] text-azure-300">
                  <Layers size={22} />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2 flex-none items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80" />
                </span>
                <h3 className="truncate font-display text-base font-bold text-white tracking-tight sm:text-lg drop-shadow-sm">
                  {game.name}
                </h3>
              </div>

              <div className="mt-1 flex items-center gap-2">
                <p className="text-xs sm:text-sm font-semibold text-emerald-300 drop-shadow-sm">
                  {playerDisplay}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Total feature count pill + Play button + Arrow Toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t border-white/10 sm:border-t-0">
            {/* Feature Count Pill */}
            <span className="inline-flex items-center rounded-full border border-azure-400/40 bg-[#0c183d]/85 backdrop-blur-sm px-3 py-1 text-xs font-medium text-slate-200 shadow-sm">
              <span className="font-bold text-azure-300 mr-1">{totalFeatures}</span>
              features
            </span>

            {/* Play Button (Opens Roblox, does NOT toggle card) */}
            <a
              href={playUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-azure-400/50 bg-azure-600/40 hover:bg-azure-500 hover:border-azure-300 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm transition-all duration-200 hover:shadow-glow-sm"
            >
              <Play size={10} className="fill-current text-white" />
              <span>Play</span>
            </a>

            {/* Arrow / Chevron */}
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition-colors group-hover:text-white">
              <ChevronDown
                size={18}
                className={`transition-transform duration-300 ease-out ${
                  isExpanded ? 'rotate-180 text-azure-300' : 'text-slate-300'
                }`}
              />
            </div>
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
              className="relative z-10 border-t border-azure-500/30 bg-[#0b1739] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] px-4 sm:px-6 pt-4 pb-6"
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
                              ? 'border border-azure-400 bg-azure-500 text-white font-semibold shadow-md shadow-azure-900/50'
                              : 'border border-azure-500/30 bg-[#10204a] text-slate-200 hover:border-azure-400/60 hover:bg-[#142656] hover:text-white'
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
                          <h4 className="text-[11px] font-bold tracking-wider text-azure-300/90 uppercase">
                            {section.name}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(section.features) && section.features.length > 0 ? (
                              section.features.map((feat, fIdx) => (
                                <span
                                  key={feat + fIdx}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-azure-400/25 bg-[#0f1d44] px-3 py-1 text-xs text-slate-100 shadow-sm transition-colors hover:border-azure-400/50 hover:bg-[#132352] hover:text-white"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-azure-400 flex-none shadow-sm shadow-azure-400/80" />
                                  <span>{feat}</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400 italic">No features listed</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-300">
                      No sections or features found in this tab.
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-300">
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
