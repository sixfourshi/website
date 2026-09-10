import { Reveal } from './Reveal';
import { formatExecutionCount } from '@/lib/execution-types';

export function Stats({
  lastUpdated = '—',
  gameCount = 0,
  totalExecutions = 0,
  version = '—',
  scriptCount,
}: {
  lastUpdated?: string;
  gameCount?: number;
  totalExecutions?: number;
  version?: string;
  scriptCount?: number;
}) {
  const items = [
    { label: 'Total Executions', value: formatExecutionCount(totalExecutions) },
    { label: 'Last updated', value: lastUpdated },
    { label: 'Games supported', value: typeof gameCount === 'number' ? gameCount : 0 },
    { label: 'Current version', value: version },
  ];

  return (
    <section className="relative mx-auto -mt-6 max-w-4xl px-5">
      <Reveal>
        <div className="grid grid-cols-2 divide-y divide-line rounded-2xl border border-line bg-surface/50 shadow-glow-sm backdrop-blur-sm sm:grid-cols-4 sm:divide-y-0 sm:divide-x">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center justify-center gap-1 px-3 py-6 text-center sm:px-4"
            >
              <span className="font-display text-xl font-semibold text-ink sm:text-2xl lg:text-3xl whitespace-nowrap">
                {item.value}
              </span>
              <span className="text-xs text-ink-faint whitespace-nowrap">{item.label}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
