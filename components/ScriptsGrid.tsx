'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Search, ArrowUpRight } from 'lucide-react';
import { Icon } from './Icon';
import { Reveal } from './Reveal';
import type { Script } from '@/lib/scripts';

export function ScriptsGrid({ scripts }: { scripts: Script[] }) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(scripts.map((s) => s.category)))],
    [scripts]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scripts.filter((s) => {
      const matchesCat =
        selectedCategory === 'All' || s.category === selectedCategory;
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [scripts, query, selectedCategory]);

  return (
    <section id="scripts" className="mx-auto max-w-6xl px-5 py-24">
      <Reveal>
        <div className="mb-8 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-azure-500/30 bg-azure-500/10 px-3 py-1 text-xs font-medium text-azure-300">
              <span className="h-1.5 w-1.5 rounded-full bg-azure-400 animate-pulse" />
              Verified &amp; Keyless
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Scripts Library
            </h1>
            <p className="mt-2 max-w-md text-sm text-slate-300">
              {scripts.length} keyless scripts with instantaneous loaders, versioning, and raw endpoints.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search scripts..."
              className="w-full rounded-xl border border-line/80 bg-[#0c1533]/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-400 focus:border-azure-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            const count =
              cat === 'All'
                ? scripts.length
                : scripts.filter((s) => s.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? 'border border-azure-500/50 bg-azure-500 text-white shadow-glow-sm'
                    : 'border border-line/80 bg-[#0c1533]/60 text-slate-300 hover:border-azure-500/40 hover:bg-[#121c45] hover:text-white'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                    active ? 'bg-white/20 text-white' : 'bg-surface/80 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </Reveal>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line py-16 text-center text-sm text-slate-300">
          No scripts match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((script, i) => (
            <Reveal key={script.slug} delay={(i % 3) * 70}>
              <Link
                href={`/scripts/${script.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-line/80 bg-[#0e1738]/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-azure-500/50 hover:bg-[#121c45] hover:shadow-glow-sm"
              >
                <div className="mb-4 flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line/80 bg-base/80 text-azure-300 transition-colors group-hover:border-azure-500/60">
                    <Icon name={script.icon} size={18} />
                  </span>
                  <ArrowUpRight
                    size={16}
                    className="text-slate-400 opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </div>
                <h3 className="font-display text-base font-semibold text-white">
                  {script.name}
                </h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-300">
                  {script.description}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs">
                  <span className="rounded-full border border-azure-500/30 bg-azure-500/10 px-2.5 py-1 text-azure-200">
                    {script.category}
                  </span>
                  <span className="text-slate-400">v{script.version}</span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
