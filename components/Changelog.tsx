import { Zap } from 'lucide-react';
import { Reveal } from './Reveal';
import {
  formatChangelogDateDDMMYYYY,
  formatChangelogVersion,
  type ChangelogRelease,
} from '@/lib/changelog-utils';

export function Changelog({
  releases = [],
}: {
  releases?: ChangelogRelease[];
}) {
  return (
    <section id="changelog" className="mx-auto max-w-4xl px-5 py-24">
      <Reveal>
        <div className="mb-12 text-center">
          <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300">
            <Zap size={13} className="text-zinc-300" />
            Release History
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Release Changelog
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
            Every update, newest first.
          </p>
        </div>
      </Reveal>

      <div className="space-y-6">
        {releases.length === 0 ? (
          <div className="rounded-2xl border border-line/60 bg-[#0c0c0f] p-8 text-center text-sm text-slate-400">
            No release notes published yet. Check back soon!
          </div>
        ) : (
          releases.map((release, idx) => (
            <Reveal key={release.id || release.version} delay={Math.min(idx * 50, 300)}>
              <div className="rounded-2xl border border-line/70 bg-[#0c0c0f] p-6 sm:p-7 shadow-md backdrop-blur-md transition-all hover:border-white/25 hover:bg-[#121216]">
                {/* Release Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-line/60 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {formatChangelogVersion(release.version || release.currentVersion)}
                    </span>
                    {release.isLatest && (
                      <span className="rounded-full border border-emerald-500/40 bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-400 shadow-sm">
                        LATEST
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-slate-400">
                    {formatChangelogDateDDMMYYYY(release.date || release.publishedDate)}
                  </div>
                </div>

                {/* Short Summary */}
                {release.summary && (
                  <p className="mt-3.5 text-sm leading-relaxed text-slate-200">
                    {release.summary}
                  </p>
                )}

                {/* Sections & Changes */}
                {release.sections && release.sections.length > 0 && (
                  <div className="mt-5 space-y-4">
                    {release.sections.map((section) => (
                      <div key={section.id || section.title} className="rounded-xl bg-black/40 border border-line/60 p-3.5 sm:p-4">
                        <h4 className="text-[11px] font-bold tracking-wider uppercase text-white mb-2">
                          {section.title}
                        </h4>
                        <ul className="space-y-1.5 list-disc list-inside text-xs sm:text-sm text-slate-300">
                          {section.changes.map((change, cIdx) => (
                            <li key={cIdx} className="leading-relaxed">
                              <span className="text-slate-200">{change}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          ))
        )}
      </div>
    </section>
  );
}
