import { Sparkles, CheckCircle2, RefreshCw, Zap } from 'lucide-react';
import { Reveal } from './Reveal';

interface Release {
  version: string;
  date: string;
  tag: string;
  summary: string;
  changes: {
    type: 'feat' | 'fix' | 'perf';
    text: string;
  }[];
}

const RELEASES: Release[] = [
  {
    version: '2.4.0',
    date: 'August 28, 2026',
    tag: 'Latest Release',
    summary:
      'Major optimization release featuring a overhauled single-line loader with sub-second cold starts, direct bytecode caching, and support for the newest executor bytecode revisions.',
    changes: [
      { type: 'perf', text: 'Optimized loader payload: 42% reduced execution overhead across all supported executors' },
      { type: 'feat', text: 'Added individual versioned raw endpoints (/api/raw/[slug]) for zero-friction script imports' },
      { type: 'fix', text: 'Patched teleport desync detection on Roblox latest security update' },
      { type: 'feat', text: 'Added Nightfall Macro automated sequence engine with step debugger' },
    ],
  },
  {
    version: '2.3.2',
    date: 'August 14, 2026',
    tag: 'Maintenance',
    summary:
      'Stability update resolving intermittent sandbox crashes on Android mobile executors and improving keyless tokenless bypass verification.',
    changes: [
      { type: 'fix', text: 'Resolved memory leak during prolonged auto-farm sessions in Orbit Farm' },
      { type: 'perf', text: 'Decreased HTTP handshake latency when loading Lumen ESP rendering hooks' },
      { type: 'fix', text: 'Fixed cursor offset on scaled high-DPI displays in HaloUI menus' },
    ],
  },
  {
    version: '2.2.0',
    date: 'July 20, 2026',
    tag: 'Feature Update',
    summary:
      'Lumen ESP engine refresh with dynamic team color awareness, distance sliders, and low-spec hardware rendering mode.',
    changes: [
      { type: 'feat', text: 'Introduced adaptive bounding box smoothing for high-velocity players' },
      { type: 'feat', text: 'Added customizable color palettes and opacity controls' },
      { type: 'fix', text: 'Prevented rare canvas crash when players disconnect abruptly' },
    ],
  },
  {
    version: '2.0.0',
    date: 'June 10, 2026',
    tag: 'Major Release',
    summary:
      'Sour Hub 2.0 release: permanent transition to 100% keyless architecture with zero linkvertise barriers and raw loadstring endpoints.',
    changes: [
      { type: 'feat', text: 'Complete keyless infrastructure launch — no ads, checkpoints, or keys forever' },
      { type: 'feat', text: 'Unified single-line universal loader format' },
      { type: 'perf', text: 'Modular script core architecture with dynamic loading' },
    ],
  },
];

export function Changelog({
  version,
  date,
}: {
  version: string;
  date: string;
}) {
  return (
    <section id="changelog" className="mx-auto max-w-4xl px-5 py-24">
      <Reveal>
        <div className="mb-12 text-center">
          <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-azure-500/30 bg-azure-500/10 px-3 py-1 text-xs font-medium text-azure-300">
            <Zap size={13} className="text-azure-400" />
            Release History
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Sour Hub Changelog
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
            Every update, security patch, and performance improvement logged transparently.
          </p>
        </div>
      </Reveal>

      <div className="space-y-6">
        {RELEASES.map((release, idx) => (
          <Reveal key={release.version} delay={idx * 60}>
            <div className="rounded-2xl border border-line/80 bg-[#0e1738]/90 p-6 sm:p-7 shadow-md transition-all hover:border-azure-500/40">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-display text-xl font-bold text-white">
                    v{release.version}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      idx === 0
                        ? 'border border-azure-500/40 bg-azure-500/15 text-azure-300'
                        : 'border border-line/60 bg-base/60 text-slate-400'
                    }`}
                  >
                    {release.tag}
                  </span>
                </div>
                <span className="text-xs text-slate-400">{release.date}</span>
              </div>

              <p className="mb-5 text-sm leading-relaxed text-slate-200">
                {release.summary}
              </p>

              <ul className="space-y-2 border-t border-line/50 pt-4">
                {release.changes.map((item, cIdx) => (
                  <li key={cIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                    <span className="mt-0.5">
                      {item.type === 'feat' && (
                        <span className="rounded bg-azure-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-azure-300">
                          NEW
                        </span>
                      )}
                      {item.type === 'fix' && (
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                          FIX
                        </span>
                      )}
                      {item.type === 'perf' && (
                        <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-purple-300">
                          PERF
                        </span>
                      )}
                    </span>
                    <span className="leading-normal">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
