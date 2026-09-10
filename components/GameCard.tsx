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
          ? 'border-[#5b469b]/60 bg-[#090b1e] shadow-2xl shadow-[#1f103d]/40 ring-1 ring-[#7c5cd6]/30'
          : 'border-white/10 bg-[#0a0c22]/90 hover:border-[#5b469b]/40 hover:bg-[#0c0e28] shadow-md hover:shadow-lg'
      }`}
    >
      {/* Unified Continuous Background Artwork across the ENTIRE card (header + expanded panel) */}
      {game.thumbnailUrl && !thumbError ? (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <Image
            src={game.thumbnailUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
            loading="lazy"
            referrerPolicy="no-referrer"
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.01]"
            onError={() => setThumbError(true)}
          />
          {/* Translucent dark gradient overlay across the whole card so tabs & features remain readable while artwork is clearly visible */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#090b1e]/75 via-[#0b0c24]/80 to-[#08091a]/85" />
          {/* Subtle ambient tint */}
          <div className="absolute inset-0 bg-[#070c1b]/30" />
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-[#0e1230] to-[#07091c]" />
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
        className="relative z-10 flex cursor-pointer select-none flex-col gap-3.5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
      >
        {/* Left: Game Icon + Name + Live Player Count */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative h-13 w-13 sm:h-14 sm:w-14 flex-none overflow-hidden rounded-xl border border-white/20 bg-[#0a0c20] shadow-xl shadow-black/50 transition-transform duration-300 group-hover:scale-[1.03]">
            {!imgError && game.iconUrl ? (
              <Image
                src={game.iconUrl}
                alt={game.name}
                fill
                sizes="56px"
                referrerPolicy="no-referrer"
                className="object-cover brightness-105 contrast-105"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1b1542] to-[#0a0c20] text-purple-300">
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
              <h3 className="truncate font-display text-base font-bold text-white tracking-tight sm:text-lg drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                {game.name}
              </h3>
            </div>

            <div className="mt-1 flex items-center gap-2">
              <p className="text-xs sm:text-sm font-semibold text-emerald-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {playerDisplay}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Total feature count pill + Play button + Arrow Toggle */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t border-white/10 sm:border-t-0">
          {/* Feature Count Pill */}
          <span className="inline-flex items-center rounded-full border border-[#7c5cd6]/40 bg-[#120d2a]/60 backdrop-blur-sm px-3.5 py-1 text-xs font-medium text-slate-200 shadow-sm">
            <span className="font-bold text-[#c4b5fd] mr-1">{totalFeatures}</span>
            features
          </span>

          {/* Play Button (Opens Roblox, does NOT toggle card) */}
          <a
            href={playUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#7c5cd6]/45 bg-[#25154d]/50 hover:bg-[#341e6c]/70 hover:border-[#9375ea] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm transition-all duration-200 hover:shadow-glow-sm"
          >
            <Play size={10} className="fill-current text-white" />
            <span>Play</span>
          </a>

          {/* Arrow / Chevron */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition-colors group-hover:text-white">
            <ChevronDown
              size={17}
              className={`transition-transform duration-300 ease-out ${
                isExpanded ? 'rotate-180 text-purple-300' : 'text-slate-400'
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
            {/* Expanded Content Panel: translucent wash (not solid!) allowing continuous background artwork to shine through */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 border-t border-white/10 bg-black/25 backdrop-blur-[1px] px-4 sm:px-6 pt-4 pb-6"
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
                          className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer ${
                            isActive
                              ? 'border border-[#8b5cf6]/80 bg-[#25154d]/60 text-purple-200 font-semibold shadow-sm'
                              : 'border border-white/10 bg-black/35 text-slate-300 hover:border-white/25 hover:bg-black/50 hover:text-white'
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
                                  className="inline-flex items-center gap-1.5 rounded-full border border-[#7c5cd6]/25 bg-black/45 hover:bg-black/65 px-3 py-1 text-xs text-slate-200 backdrop-blur-xs transition-colors shadow-sm"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#a855f7] flex-none shadow-sm shadow-purple-500/80" />
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
