import Link from 'next/link';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import { Reveal } from './Reveal';

export function Hero() {
  return (
    <section className="relative pb-24 pt-40">
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-5 text-center">
        <Reveal>
          <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-surface/60 shadow-glow">
            <Zap className="h-8 w-8 text-azure-300" />
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-azure-500/30 bg-surface/80 px-3.5 py-1.5 text-xs font-medium text-azure-200 shadow-glow-sm">
            <Sparkles size={13} className="text-azure-400" />
            100% Free &amp; Keyless Forever
          </div>
        </Reveal>

        <Reveal delay={140}>
          <h1 className="font-display text-5xl font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl">
            Scripts that are just
            <br />
            <span className="bg-gradient-to-r from-azure-200 via-azure-300 to-azure-400 bg-clip-text text-transparent">
              keyless forever
            </span>
          </h1>
        </Reveal>

        <Reveal delay={200}>
          <p className="mt-6 max-w-xl text-balance text-base leading-relaxed text-slate-200 sm:text-lg">
            No linkvertise checkpoints. No 24-hour expiring keys. Just clean single-line loaders, instant bypasses, and raw scripts that actually survive game updates.
          </p>
        </Reveal>

        <Reveal delay={260}>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/scripts"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-azure-500 px-6 py-3 text-sm font-medium text-white shadow-glow transition-all hover:-translate-y-0.5 hover:bg-azure-400"
            >
              Browse scripts
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              href="/#demo"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface/60 px-6 py-3 text-sm font-medium text-ink transition-all hover:-translate-y-0.5 hover:border-azure-700 hover:bg-surface"
            >
              Watch the demo
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
