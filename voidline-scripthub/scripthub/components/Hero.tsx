import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import { Reveal } from './Reveal';

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-24 pt-40">
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-azure-600/25 blur-[140px] animate-glow-pulse" />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-5 text-center">
        <Reveal>
          <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-surface/60 shadow-glow">
            <Zap className="h-8 w-8 text-azure-300" />
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/60 px-3.5 py-1.5 text-xs text-ink-muted">
            <Sparkles size={13} className="text-azure-300" />
            Free, always up to date
          </div>
        </Reveal>

        <Reveal delay={140}>
          <h1 className="font-display text-5xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl">
            Scripts that just
            <br />
            <span className="bg-gradient-to-r from-azure-200 via-azure-300 to-azure-500 bg-clip-text text-transparent">
              work, every time
            </span>
          </h1>
        </Reveal>

        <Reveal delay={200}>
          <p className="mt-6 max-w-xl text-balance text-base leading-relaxed text-ink-muted sm:text-lg">
            Voidline keeps a small, well-maintained library of Roblox scripts
            with a simple loader, clear changelogs, and a raw endpoint for
            every release.
          </p>
        </Reveal>

        <Reveal delay={260}>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="#scripts"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-azure-500 px-6 py-3 text-sm font-medium text-white shadow-glow transition-all hover:-translate-y-0.5 hover:bg-azure-400"
            >
              Browse scripts
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </a>
            <a
              href="#demo"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface/60 px-6 py-3 text-sm font-medium text-ink transition-all hover:-translate-y-0.5 hover:border-azure-700 hover:bg-surface"
            >
              Watch the demo
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
