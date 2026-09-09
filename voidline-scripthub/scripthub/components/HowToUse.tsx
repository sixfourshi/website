import { Reveal } from './Reveal';

const STEPS = [
  {
    title: 'Pick a script',
    description: 'Browse the library and open the one you want to run.',
  },
  {
    title: 'Copy the loader',
    description: 'Use the copy button on the script page to grab its snippet.',
  },
  {
    title: 'Open your executor',
    description: 'Paste the snippet into your executor of choice and run it.',
  },
  {
    title: 'Check the changelog',
    description: 'Scripts update often — the changelog tracks every change.',
  },
];

export function HowToUse() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-24">
      <Reveal>
        <div className="mb-10 text-center">
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            How to use Voidline
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
            Four steps, start to finish.
          </p>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <Reveal key={step.title} delay={i * 80}>
            <div className="h-full rounded-2xl border border-line bg-surface/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-azure-700">
              <span className="font-display text-3xl font-semibold text-azure-500/40">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-4 font-display text-base font-semibold text-ink">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                {step.description}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
