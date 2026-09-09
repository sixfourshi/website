import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <p className="font-display text-6xl font-semibold text-azure-500/40">
        404
      </p>
      <h1 className="mt-3 font-display text-xl font-semibold text-ink">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        That script or page doesn&rsquo;t exist, or may have been renamed.
      </p>
      <Link
        href="/"
        className="mt-7 flex items-center gap-2 rounded-xl bg-azure-500 px-5 py-2.5 text-sm font-medium text-white shadow-glow-sm transition-colors hover:bg-azure-400"
      >
        <ArrowLeft size={15} />
        Back home
      </Link>
    </main>
  );
}
