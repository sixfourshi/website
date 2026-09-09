import Link from 'next/link';
import { MessageCircle, Twitter, Zap } from 'lucide-react';

const NAV = [
  { href: '#scripts', label: 'Scripts' },
  { href: '#executors', label: 'Executors' },
  { href: '#changelog', label: 'Changelog' },
  { href: '#faq', label: 'FAQ' },
];

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex flex-col justify-between gap-10 sm:flex-row">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-azure-400 to-azure-700">
                <Zap className="h-3.5 w-3.5 text-white" />
              </span>
              <span className="font-display text-base font-semibold text-ink">
                Voidline
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-ink-faint">
              A small, well-maintained library of Roblox scripts with clear
              versioning and a raw endpoint for every release.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="#"
                aria-label="Discord"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-muted transition-colors hover:border-azure-700 hover:text-ink"
              >
                <MessageCircle size={16} />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-muted transition-colors hover:border-azure-700 hover:text-ink"
              >
                <Twitter size={16} />
              </a>
            </div>
          </div>

          <div className="flex gap-16">
            <div>
              <h4 className="mb-3 text-xs font-medium text-ink-faint">
                Navigate
              </h4>
              <ul className="space-y-2.5">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="text-sm text-ink-muted transition-colors hover:text-ink"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-xs text-ink-faint sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Voidline. All rights reserved.</p>
          <p>Not affiliated with Roblox Corporation.</p>
        </div>
      </div>
    </footer>
  );
}
