import { Reveal } from './Reveal';

const EXECUTORS = [
  { name: 'Solara', status: 'ok' },
  { name: 'Wave', status: 'ok' },
  { name: 'Codex', status: 'ok' },
  { name: 'Volcano', status: 'ok' },
  { name: 'Nihon', status: 'warn' },
  { name: 'Cryptic', status: 'ok' },
];

const STATUS_STYLES: Record<string, string> = {
  ok: 'bg-emerald-400',
  warn: 'bg-amber-400',
};

export function Executors() {
  return (
    <section id="executors" className="mx-auto max-w-6xl px-5 py-24">
      <Reveal>
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              Compatibility
            </h2>
            <p className="mt-2 max-w-md text-sm text-ink-muted">
              Every release is tested against the executors below before it
              ships.
            </p>
          </div>
          <a
            href="#scripts"
            className="text-sm text-azure-300 transition-colors hover:text-azure-200"
          >
            View all scripts
          </a>
        </div>
      </Reveal>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {EXECUTORS.map((exec, i) => (
          <Reveal key={exec.name} delay={i * 60}>
            <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface/50 px-4 py-3.5 transition-colors hover:border-azure-700 hover:bg-surface">
              <span
                className={`h-1.5 w-1.5 rounded-full ${STATUS_STYLES[exec.status]}`}
              />
              <span className="text-sm text-ink">{exec.name}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
