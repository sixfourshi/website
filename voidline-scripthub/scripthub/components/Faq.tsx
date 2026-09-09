'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Reveal } from './Reveal';

const FAQS = [
  {
    q: 'Is Voidline free to use?',
    a: 'Yes. Every script in the library is free, with no tiers or paywalls.',
  },
  {
    q: 'How often are scripts updated?',
    a: 'Most scripts get small updates within a few days of a game patch. Check the changelog for exact dates.',
  },
  {
    q: 'What executors are supported?',
    a: 'The compatibility section lists everything tested against the current release. Most modern executors work out of the box.',
  },
  {
    q: 'Can I request a script?',
    a: 'Yes — reach out on Discord and describe what you need. We prioritize requests with the most interest.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 py-24">
      <Reveal>
        <div className="mb-10 text-center">
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            Frequently asked
          </h2>
        </div>
      </Reveal>

      <div className="space-y-3">
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          return (
            <Reveal key={item.q} delay={i * 60}>
              <div className="overflow-hidden rounded-2xl border border-line bg-surface/50">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-medium text-ink sm:text-base">
                    {item.q}
                  </span>
                  <Plus
                    size={18}
                    className={`flex-none text-azure-300 transition-transform duration-300 ${
                      isOpen ? 'rotate-45' : ''
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-sm leading-relaxed text-ink-muted">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
