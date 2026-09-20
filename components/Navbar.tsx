'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X, Zap } from 'lucide-react';

const LINKS = [
  { href: '/games', label: 'Games' },
  { href: '/suggestion', label: 'Suggestions' },
  { href: '/changelog', label: 'Changelog' },
  { href: '/#demo', label: 'Demo' },
  { href: '/#faq', label: 'FAQ' },
];

function DiscordIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const discordInviteUrl =
    process.env.NEXT_PUBLIC_DISCORD_INVITE_URL?.trim() || 'https://discord.gg/ENgU3jvBbN';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isLinkActive = (href: string) => {
    if (href.startsWith('/#')) return false;
    if (href === '/games') return pathname.startsWith('/games') || pathname.startsWith('/scripts');
    if (href === '/suggestion') return pathname.startsWith('/suggestion');
    return pathname === href;
  };

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/[0.08] bg-[#09090b]/90 backdrop-blur-xl shadow-lg shadow-black/80'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-gradient-to-br from-zinc-700 via-zinc-800 to-black shadow-glow-sm">
            <Zap className="h-4.5 w-4.5 text-white" size={18} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-white">
            Nova Hub
          </span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {LINKS.map((link) => {
            const active = isLinkActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3.5 py-1.5 text-sm transition-all ${
                  active
                    ? 'border border-white/20 bg-white/10 font-medium text-white shadow-glow-sm'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={discordInviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black shadow-glow-sm transition-all hover:bg-zinc-200 hover:shadow-glow cursor-pointer"
          >
            <DiscordIcon className="h-4 w-4" />
            <span>Discord Server</span>
          </a>
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <div
        className={`overflow-hidden border-b border-white/[0.08] bg-[#09090b]/95 backdrop-blur-xl transition-[max-height] duration-300 md:hidden ${
          open ? 'max-h-80' : 'max-h-0'
        }`}
      >
        <div className="flex flex-col gap-1 px-5 py-3">
          {LINKS.map((link) => {
            const active = isLinkActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? 'border border-white/20 bg-white/10 font-medium text-white'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <a
            href={discordInviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2.5 text-center text-sm font-semibold text-black shadow-glow-sm hover:bg-zinc-200 cursor-pointer"
          >
            <DiscordIcon className="h-4 w-4" />
            <span>Discord Server</span>
          </a>
        </div>
      </div>
    </header>
  );
}
