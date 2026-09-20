'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Copy, Sparkles, Zap } from 'lucide-react';
import { Reveal } from './Reveal';
import { copyToClipboard } from './Toast';

export function Hero() {
  const [copied, setCopied] = useState(false);

  const handleCopyLoader = async () => {
    const loaderSnippet = 'loadstring(game:HttpGet("https://novahub.vercel.app/loader"))()';
    const success = await copyToClipboard(loaderSnippet, 'Loader copied to clipboard!');
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section className="relative pb-24 pt-40">
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-5 text-center">
        <Reveal>
          <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-[#0e0e12] shadow-glow">
            <Zap className="h-8 w-8 text-white" />
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-xs font-medium text-zinc-300 shadow-glow-sm">
            <Sparkles size={13} className="text-zinc-400" />
            100% Free &amp; Keyless
          </div>
        </Reveal>

        <Reveal delay={140}>
          <h1 className="font-display text-5xl font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl">
            One loader. Famous games.
            <br />
            <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Zero keys.
            </span>
          </h1>
        </Reveal>

        <Reveal delay={200}>
          <p className="mt-6 max-w-xl text-balance text-base leading-relaxed text-zinc-300 sm:text-lg">
            Free, keyless scripts for the games we build - no ads, checkpoints.
          </p>
        </Reveal>

        <Reveal delay={260}>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleCopyLoader}
              className={`group inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold shadow-glow transition-all hover:-translate-y-0.5 cursor-pointer ${
                copied
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                  : 'bg-white hover:bg-zinc-200 text-black'
              }`}
            >
              {copied ? (
                <>
                  <Check size={16} className="text-white" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={16} className="text-black transition-transform group-hover:scale-105" />
                  <span>Copy Loader</span>
                </>
              )}
            </button>
            <Link
              href="/games"
              className="group inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#121216] px-6 py-3 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:border-white/30 hover:bg-[#18181d]"
            >
              Browse Games
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5 text-zinc-400 group-hover:text-white"
              />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
