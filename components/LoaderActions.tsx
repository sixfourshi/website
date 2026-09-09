'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';

export function LoaderActions({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const snippet = `loadstring(game:HttpGet("${origin}/raw/${slug}"))()`;
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={onCopy}
        className="flex items-center gap-2 rounded-xl bg-azure-500 px-5 py-2.5 text-sm font-medium text-white shadow-glow-sm transition-all hover:-translate-y-0.5 hover:bg-azure-400"
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
        {copied ? 'Copied loader' : 'Copy loader'}
      </button>
      <a
        href={`/raw/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-xl border border-line bg-surface/60 px-5 py-2.5 text-sm font-medium text-ink transition-all hover:-translate-y-0.5 hover:border-azure-700"
      >
        <ExternalLink size={15} />
        View raw
      </a>
    </div>
  );
}
