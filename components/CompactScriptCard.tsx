'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Copy,
  Code2,
  ExternalLink,
  Tag,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Script } from '@/lib/scripts';
import { Icon } from './Icon';
import { CodeViewer } from './CodeViewer';
import { copyToClipboard } from './Toast';

interface CompactScriptCardProps {
  script: Script;
}

export function CompactScriptCard({ script }: CompactScriptCardProps) {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const getLoadstring = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `loadstring(game:HttpGet("${origin}/raw/${script.slug}"))()`;
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(getLoadstring(), 'Script copied to clipboard!');
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-2xl border border-line/80 bg-[#0c0c0f] p-5 sm:p-6 shadow-sm transition-all duration-200 hover:border-white/20 hover:bg-[#121216]">
      {/* Top row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-line/70 bg-black/60 text-white">
            <Icon name={script.icon} size={18} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-display text-base font-bold text-white sm:text-lg">
                {script.name}
              </h4>
              <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-zinc-300">
                v{script.version}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1 rounded-md border border-line/60 bg-base/60 px-2.5 py-1 text-slate-300">
            <Tag size={11} className="text-zinc-400" />
            {script.category}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-line/60 bg-base/60 px-2.5 py-1 text-slate-400">
            <Clock size={11} />
            {script.updatedAt}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="mt-3 text-sm leading-relaxed text-slate-300">
        {script.description}
      </p>

      {/* Features Badges */}
      {script.features && script.features.length > 0 && (
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {script.features.map((feat, i) => (
            <span
              key={i}
              className="rounded-lg border border-line/60 bg-black/40 px-2.5 py-0.5 text-[11px] font-medium text-slate-300"
            >
              ✓ {feat}
            </span>
          ))}
        </div>
      )}

      {/* Action Toolbar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-4">
        {/* Copy Loadstring CTA */}
        <button
          type="button"
          onClick={handleCopy}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            copied
              ? 'border border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
              : 'border border-white/20 bg-white/10 text-white hover:border-white/40 hover:bg-white hover:text-black shadow-glow-sm'
          }`}
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span>Copied Loadstring!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy Loadstring</span>
            </>
          )}
        </button>

        {/* Code & Raw actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCode(!showCode)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line/70 bg-black/40 px-3 py-2 text-xs font-medium text-slate-300 hover:border-white/20 hover:text-white transition-colors"
          >
            <Code2 size={13} />
            <span>{showCode ? 'Hide Code' : 'View Code'}</span>
            {showCode ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          <Link
            href={`/raw/${script.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-xl border border-line/70 bg-black/40 px-2.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            title="Open raw Lua endpoint"
          >
            <ExternalLink size={12} />
            <span className="hidden sm:inline">Raw</span>
          </Link>
        </div>
      </div>

      {/* Expandable Code Viewer */}
      {showCode && (
        <div className="mt-4 overflow-hidden rounded-xl border border-line/80 bg-black">
          <div className="flex items-center justify-between border-b border-line/60 bg-[#0c0c0f] px-4 py-2 text-xs text-slate-400">
            <span className="font-mono text-[11px] text-zinc-300">
              {script.slug}.lua
            </span>
            <span className="text-[11px] text-slate-400">Lua Module</span>
          </div>
          <CodeViewer code={script.code} />
        </div>
      )}
    </div>
  );
}
