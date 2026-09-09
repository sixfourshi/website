'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Zap } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Invalid credentials.');
        setLoading(false);
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5">
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-azure-600/25 blur-[130px]" />

      <div className="relative w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-azure-400 to-azure-700 shadow-glow-sm">
            <Zap className="h-4 w-4 text-white" />
          </span>
          <span className="font-display text-lg font-semibold text-ink">
            Voidline
          </span>
        </Link>

        <div className="rounded-2xl border border-line bg-surface/60 p-7 shadow-glow-sm backdrop-blur-sm">
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-base/60 text-azure-300">
              <Lock size={17} />
            </span>
            <h1 className="font-display text-lg font-semibold text-ink">
              Owner sign in
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              This area is restricted to the site owner.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-ink-muted">
                Username
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full rounded-xl border border-line bg-base/60 px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-azure-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-ink-muted">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-line bg-base/60 px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-azure-600 focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-azure-500 py-2.5 text-sm font-medium text-white shadow-glow-sm transition-all hover:bg-azure-400 disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
