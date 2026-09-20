import { Play } from 'lucide-react';
import { Reveal } from './Reveal';

export function Demo() {
  return (
    <section id="demo" className="mx-auto max-w-5xl px-5 py-24">
      <Reveal>
        <div className="mb-10 text-center">
          <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
            See it in action
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
            A quick look at the loader and the script menu in-game.
          </p>
        </div>
      </Reveal>

      <Reveal delay={100}>
        <div className="group relative aspect-video overflow-hidden rounded-3xl border border-line bg-surface/60 shadow-glow">
          <div className="absolute inset-0 bg-grid opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-base via-transparent to-transparent" />
          <button
            type="button"
            aria-label="Play demo video"
            className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-glow transition-transform duration-300 hover:scale-110"
          >
            <Play size={22} className="ml-0.5" fill="currentColor" />
          </button>
        </div>
      </Reveal>
    </section>
  );
}
