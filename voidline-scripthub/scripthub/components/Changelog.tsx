import { Reveal } from './Reveal';

const CHANGES = [
  'Reworked the loader for a ~30% faster cold start',
  'Added versioned raw endpoints for every script',
  'Fixed a rare crash when switching categories quickly',
  'Improved dashboard search and sorting',
];

export function Changelog({
  version,
  date,
}: {
  version: string;
  date: string;
}) {
  return (
    <section id="changelog" className="mx-auto max-w-3xl px-5 py-24">
      <Reveal>
        <div className="mb-10 text-center">
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            Changelog
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            What shipped most recently.
          </p>
        </div>
      </Reveal>

      <Reveal delay={100}>
        <div className="rounded-2xl border border-line bg-surface/50 p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-azure-500/15 px-3 py-1 text-xs font-medium text-azure-300">
                v{version}
              </span>
              <span className="text-xs text-ink-faint">{date}</span>
            </div>
          </div>
          <p className="mb-5 text-sm leading-relaxed text-ink-muted">
            A stability-focused release with a faster loader and a cleaner
            dashboard for managing scripts.
          </p>
          <ul className="space-y-2.5">
            {CHANGES.map((change) => (
              <li key={change} className="flex items-start gap-2.5 text-sm text-ink-muted">
                <span className="mt-1.5 h-1 w-1 flex-none rounded-full bg-azure-400" />
                {change}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
