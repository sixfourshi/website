'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { copyToClipboard } from './Toast';

const KEYWORDS = new Set([
  'local', 'function', 'end', 'if', 'then', 'else', 'elseif', 'return',
  'for', 'while', 'do', 'repeat', 'until', 'true', 'false', 'nil', 'and',
  'or', 'not', 'in', 'break', 'continue', 'require', 'setmetatable',
]);

function highlight(line: string): React.ReactNode[] {
  const tokens = line.split(/(\s+|--.*|"[^"]*"|'[^']*'|[(){}\[\],.]|[A-Za-z_][A-Za-z0-9_]*|\d+)/g);
  return tokens.map((tok, i) => {
    if (!tok) return null;
    if (tok.startsWith('--')) {
      return (
        <span key={i} className="text-ink-faint">
          {tok}
        </span>
      );
    }
    if (/^["'].*["']$/.test(tok)) {
      return (
        <span key={i} className="text-emerald-300/80">
          {tok}
        </span>
      );
    }
    if (KEYWORDS.has(tok)) {
      return (
        <span key={i} className="text-zinc-100 font-medium">
          {tok}
        </span>
      );
    }
    if (/^\d+$/.test(tok)) {
      return (
        <span key={i} className="text-amber-300/80">
          {tok}
        </span>
      );
    }
    return <span key={i}>{tok}</span>;
  });
}

export function CodeViewer({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const success = await copyToClipboard(code, 'Script copied to clipboard!');
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const lines = code.replace(/\n$/, '').split('\n');

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface/50">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
        </div>
        <button
          onClick={onCopy}
          className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-ink-muted transition-colors hover:border-white/40 hover:text-white"
        >
          {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="max-h-[480px] overflow-auto px-5 py-4 text-[13px] leading-relaxed">
        <code className="font-mono">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="mr-4 w-5 flex-none select-none text-right text-ink-faint/50">
                {i + 1}
              </span>
              <span className="text-ink/90">{highlight(line)}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
