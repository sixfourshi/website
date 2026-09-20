'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { copyToClipboard } from './Toast';

export function LoaderActions({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const snippet = `loadstring(game:HttpGet("${origin}/raw/${slug}"))()`;
    const success = await copyToClipboard(snippet, 'Script copied to clipboard!');
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={onCopy}
        className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-sm transition-all hover:-translate-y-0.5 hover:bg-zinc-200 cursor-pointer"
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
        {copied ? 'Copied loader' : 'Copy loader'}
      </button>
      <a
        href={`/raw/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-xl border border-line bg-surface/60 px-5 py-2.5 text-sm font-medium text-ink transition-all hover:-translate-y-0.5 hover:border-white/30 hover:text-white"
      >
        <ExternalLink size={15} />
        View raw
      </a>
    </div>
  );
}
