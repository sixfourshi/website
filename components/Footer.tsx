import Link from 'next/link';
import { Zap } from 'lucide-react';

const NAV = [
  { href: '/scripts', label: 'Games' },
  { href: '/executors', label: 'Executors' },
  { href: '/changelog', label: 'Changelog' },
  { href: '/#demo', label: 'Demo' },
  { href: '/#faq', label: 'FAQ' },
];

function DiscordIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer
      id="site-footer"
      className="relative z-10 w-full border-t border-line/80 bg-[#040816]/95 backdrop-blur-2xl shadow-[0_-12px_30px_rgba(2,6,23,0.8)]"
    >
      {/* Clean top accent highlight for seamless transition from the grid background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-azure-500/40 to-transparent" />

      {/* Compact, neatly aligned dark footer container */}
      <div className="relative mx-auto max-w-4xl px-5 pt-6 pb-5 sm:px-8 sm:pt-7 sm:pb-6">
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-azure-400 to-azure-700 shadow-glow-sm">
                <Zap className="h-3.5 w-3.5 text-white" />
              </span>
              <span className="font-display text-base font-semibold text-white">
                Sour Hub
              </span>
            </Link>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">
              A curated collection of keyless Roblox scripts with fast loaders
              and raw endpoints for every release.
            </p>
            <div className="mt-3.5 flex items-center gap-3">
              <a
                href="https://discord.gg"
                target="_blank"
                rel="noreferrer"
                aria-label="Discord"
                className="group flex h-8.5 w-8.5 items-center justify-center rounded-lg border border-line bg-surface/40 text-ink-muted transition-all hover:border-azure-500/80 hover:bg-[#0d1636] hover:text-[#5865F2] hover:shadow-glow-sm"
              >
                <DiscordIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Navigate
            </h4>
            <ul className="space-y-1.5 sm:space-y-2">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-ink-muted transition-colors hover:text-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-2.5 border-t border-line/60 pt-4 text-xs text-ink-faint sm:mt-7 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Sour Hub. All rights reserved.</p>
          <p>Not affiliated with Roblox Corporation.</p>
        </div>
      </div>
    </footer>
  );
}
