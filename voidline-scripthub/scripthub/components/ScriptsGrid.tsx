'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Search, ArrowUpRight } from 'lucide-react';
import { Icon } from './Icon';
import { Reveal } from './Reveal';
import type { Script } from '@/lib/scripts';

export function ScriptsGrid({ scripts }: { scripts: Script[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scripts;
    return scripts.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [scripts, query]);

  return (
    <section id="scripts" className="mx-auto max-w-6xl px-5 py-24">
      <Reveal>
        <div className="mb-10 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              The library
            </h2>
            <p className="mt-2 max-w-md text-sm text-ink-muted">
              {scripts.length} scripts, maintained and versioned individually.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search scripts..."
              className="w-full rounded-xl border border-line bg-surface/60 py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint focus:border-azure-600 focus:outline-none"
            />
          </div>
        </div>
      </Reveal>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line py-16 text-center text-sm text-ink-muted">
          No scripts match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((script, i) => (
            <Reveal key={script.slug} delay={(i % 3) * 70}>
              <Link
                href={`/scripts/${script.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-line bg-surface/50 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-azure-700 hover:bg-surface hover:shadow-glow-sm"
              >
                <div className="mb-4 flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-base/60 text-azure-300 transition-colors group-hover:border-azure-700">
                    <Icon name={script.icon} size={18} />
                  </span>
                  <ArrowUpRight
                    size={16}
                    className="text-ink-faint opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </div>
                <h3 className="font-display text-base font-semibold text-ink">
                  {script.name}
                </h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-muted">
                  {script.description}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs">
                  <span className="rounded-full border border-line px-2.5 py-1 text-ink-muted">
                    {script.category}
                  </span>
                  <span className="text-ink-faint">v{script.version}</span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
