import Link from 'next/link';
import { CheckCircle2, AlertTriangle, Monitor, Smartphone, ShieldCheck, ArrowRight } from 'lucide-react';
import { Reveal } from './Reveal';

interface ExecutorInfo {
  name: string;
  platform: 'Windows' | 'Mobile' | 'Multi';
  level: string;
  unc: string;
  status: 'operational' | 'updating';
  statusText: string;
}

const EXECUTORS: ExecutorInfo[] = [
  {
    name: 'Solara',
    platform: 'Windows',
    level: 'L3 / Free',
    unc: '72% UNC',
    status: 'operational',
    statusText: 'Supported',
  },
  {
    name: 'Wave',
    platform: 'Windows',
    level: 'L7 / Premium',
    unc: '99% UNC',
    status: 'operational',
    statusText: 'Supported',
  },
  {
    name: 'Codex',
    platform: 'Mobile',
    level: 'L7 / Android',
    unc: '96% UNC',
    status: 'operational',
    statusText: 'Supported',
  },
  {
    name: 'Volcano',
    platform: 'Windows',
    level: 'L8 / Windows',
    unc: '100% UNC',
    status: 'operational',
    statusText: 'Supported',
  },
  {
    name: 'Nihon',
    platform: 'Windows',
    level: 'L7 / Free',
    unc: '88% UNC',
    status: 'updating',
    statusText: 'Patching',
  },
  {
    name: 'Cryptic',
    platform: 'Multi',
    level: 'L7 / Cross',
    unc: '95% UNC',
    status: 'operational',
    statusText: 'Supported',
  },
  {
    name: 'Delta',
    platform: 'Mobile',
    level: 'L7 / Android & iOS',
    unc: '94% UNC',
    status: 'operational',
    statusText: 'Supported',
  },
  {
    name: 'Fluxus',
    platform: 'Mobile',
    level: 'L7 / Android',
    unc: '91% UNC',
    status: 'operational',
    statusText: 'Supported',
  },
];

export function Executors() {
  return (
    <section id="executors" className="mx-auto max-w-6xl px-5 py-24">
      <Reveal>
        <div className="mb-10 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Compatibility Monitor
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Executor Compatibility
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Every Sour Hub release is tested rigorously across desktop and mobile executors before deployment.
            </p>
          </div>
          <Link
            href="/scripts"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-azure-300 transition-colors hover:text-azure-200"
          >
            <span>Browse library</span>
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Reveal>

      {/* Grid of executor cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {EXECUTORS.map((exec, i) => (
          <Reveal key={exec.name} delay={i * 40}>
            <div className="flex h-full flex-col justify-between rounded-2xl border border-line/80 bg-[#0e1738]/90 p-5 shadow-sm transition-all hover:border-azure-500/50 hover:bg-[#121c45]">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-display text-lg font-semibold text-white">
                    {exec.name}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      exec.status === 'operational'
                        ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border border-amber-500/30 bg-amber-500/10 text-amber-300'
                    }`}
                  >
                    {exec.status === 'operational' ? (
                      <CheckCircle2 size={12} className="text-emerald-400" />
                    ) : (
                      <AlertTriangle size={12} className="text-amber-400" />
                    )}
                    {exec.statusText}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-1 rounded-md border border-line/60 bg-base/60 px-2 py-0.5">
                    {exec.platform === 'Windows' ? (
                      <Monitor size={11} className="text-azure-300" />
                    ) : exec.platform === 'Mobile' ? (
                      <Smartphone size={11} className="text-purple-300" />
                    ) : (
                      <ShieldCheck size={11} className="text-emerald-300" />
                    )}
                    {exec.platform}
                  </span>
                  <span className="rounded-md border border-line/60 bg-base/60 px-2 py-0.5 text-slate-400">
                    {exec.level}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-line/50 pt-3 text-xs">
                <span className="text-slate-400">Unified Naming Conv.</span>
                <span className="font-semibold text-azure-200">{exec.unc}</span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
