import { Reveal } from './Reveal';

export function Stats({
  scriptCount,
  gameCount,
  featureCount,
  version,
}: {
  scriptCount: number;
  gameCount: number;
  featureCount: number;
  version: string;
}) {
  const items = [
    { label: 'Scripts', value: scriptCount },
    { label: 'Games supported', value: gameCount === 0 ? 'Universal' : gameCount },
    { label: 'Core features', value: featureCount },
    { label: 'Current version', value: version },
  ];

  return (
    <section className="relative mx-auto -mt-6 max-w-4xl px-5">
      <Reveal>
        <div className="grid grid-cols-2 divide-y divide-line rounded-2xl border border-line bg-surface/50 shadow-glow-sm backdrop-blur-sm sm:grid-cols-4 sm:divide-y-0 sm:divide-x">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-1 px-4 py-6 text-center"
            >
              <span className="font-display text-2xl font-semibold text-ink sm:text-3xl">
                {item.value}
              </span>
              <span className="text-xs text-ink-faint">{item.label}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
