'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Application Error]:', error);
  }, [error]);

  const isStorageConfigError =
    error?.message?.toLowerCase().includes('storage') ||
    error?.message?.toLowerCase().includes('supabase');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 mb-6">
        <AlertTriangle size={32} />
      </div>
      <h1 className="font-display text-2xl font-bold text-white mb-2">
        {isStorageConfigError ? 'Storage Configuration Required' : 'An Unexpected Error Occurred'}
      </h1>
      <p className="max-w-md text-sm text-zinc-400 mb-6 leading-relaxed">
        {isStorageConfigError
          ? error.message || 'Production storage requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be configured.'
          : 'A server error occurred while processing your request. Please try again or return home.'}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors"
        >
          <RefreshCw size={15} />
          Try again
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
        >
          <Home size={15} />
          Home
        </Link>
      </div>
    </div>
  );
}
