'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Reveal } from './Reveal';

const FAQS = [
  {
    q: 'Is Nova Hub completely free and keyless?',
    a: 'Yes. Every script in Nova Hub is 100% free and permanently keyless. No linkvertise checkpoints, no surveys, no paywalls, and no 24-hour expiring keys.',
  },
  {
    q: 'How fast are scripts updated after game patches?',
    a: 'Our scripts receive updates within hours of game patches. If an experience or Roblox updates, check our Changelog or Discord for the latest hotfix.',
  },
  {
    q: 'What executors are supported?',
    a: 'Nova Hub is tested and verified across Solara, Wave, Codex, Volcano, Nihon, Cryptic, and all modern level 7/8 Windows and mobile executors.',
  },
  {
    q: 'Can I request a script for a new game?',
    a: 'Yes. Reach out on our Discord and describe what game you want scripted. We prioritize and build requests that get the most community upvotes.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative z-10 mx-auto max-w-3xl px-5 pt-16 pb-14 sm:pt-20 sm:pb-16">
      <Reveal>
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-base text-slate-300">
            Everything you need to know about Nova Hub and our keyless loaders.
          </p>
        </div>
      </Reveal>

      <div className="space-y-4">
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          return (
            <Reveal key={item.q} delay={i * 60}>
              <div className="group overflow-hidden rounded-2xl border border-line bg-[#0c0c0f] shadow-sm backdrop-blur-md transition-all duration-200 hover:border-white/20 hover:bg-[#121217]">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-semibold text-white transition-colors group-hover:text-zinc-200 sm:text-lg">
                    {item.q}
                  </span>
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-white/5 text-zinc-300 transition-all duration-300 group-hover:bg-white/10 group-hover:text-white">
                    <Plus
                      size={18}
                      className={`transition-transform duration-300 ${
                        isOpen ? 'rotate-45' : ''
                      }`}
                    />
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-line/60 px-6 pb-6 pt-4">
                      <p className="text-base font-normal leading-relaxed text-slate-100">
                        {item.a}
                      </p>
                    </div>
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
