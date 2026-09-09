'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X, Zap } from 'lucide-react';

const LINKS = [
  { href: '#scripts', label: 'Scripts' },
  { href: '#executors', label: 'Executors' },
  { href: '#demo', label: 'Demo' },
  { href: '#changelog', label: 'Changelog' },
  { href: '#faq', label: 'FAQ' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'border-b border-line/80 bg-base/80 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-azure-400 to-azure-700 shadow-glow-sm">
            <Zap className="h-4.5 w-4.5 text-white" size={18} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            Voidline
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-ink-muted transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Log in
          </Link>
          <a
            href="#scripts"
            className="rounded-lg bg-azure-500 px-4 py-2 text-sm font-medium text-white shadow-glow-sm transition-all hover:bg-azure-400 hover:shadow-glow"
          >
            Get started
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
        className={`overflow-hidden border-b border-line/80 bg-base/95 backdrop-blur-xl transition-[max-height] duration-300 md:hidden ${
          open ? 'max-h-80' : 'max-h-0'
        }`}
      >
        <div className="flex flex-col gap-1 px-5 py-3">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-ink-muted hover:bg-surface hover:text-ink"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm text-ink-muted hover:bg-surface hover:text-ink"
          >
            Log in
          </Link>
        </div>
      </div>
    </header>
  );
}
