'use client';

import { useState } from 'react';
import {
  Zap,
  Copy,
  Check,
  ExternalLink,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Code2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { copyToClipboard } from './Toast';
import { DEFAULT_LOADER_CODE, type UniversalLoaderConfig } from '@/lib/loader-types';

export function UniversalLoaderManager({
  initialConfig,
}: {
  initialConfig?: UniversalLoaderConfig;
}) {
  const [code, setCode] = useState(initialConfig?.code || DEFAULT_LOADER_CODE);
  const [version, setVersion] = useState(initialConfig?.version || '2.4.0');
  const [enabled, setEnabled] = useState(
    initialConfig?.enabled !== undefined ? initialConfig.enabled : true
  );
  const [updatedAt, setUpdatedAt] = useState(
    initialConfig?.updatedAt || '2026-09-10'
  );

  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [statusNotice, setStatusNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleCopyLoader = async () => {
    const snippet = `loadstring(game:HttpGet("https://novahub.vercel.app/loader"))()`;
    const success = await copyToClipboard(snippet, 'Loader copied to clipboard!');
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResetToDefault = () => {
    if (
      window.confirm(
        'Reset loader to the safe default Luau source code? Your unsaved edits will be replaced.'
      )
    ) {
      setCode(DEFAULT_LOADER_CODE);
      setStatusNotice({
        type: 'success',
        text: 'Restored safe default Luau code. Click Save to persist.',
      });
      setTimeout(() => setStatusNotice(null), 4000);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusNotice(null);

    try {
      const res = await fetch('/api/loader', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          version: version.trim() || '1.0.0',
          enabled,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save Universal Loader.');
      }

      const updated = (await res.json()) as UniversalLoaderConfig;
      setUpdatedAt(updated.updatedAt);
      setStatusNotice({
        type: 'success',
        text: 'Universal Loader saved persistently to private Supabase Storage!',
      });
      setTimeout(() => setStatusNotice(null), 4000);
    } catch (err: any) {
      setStatusNotice({
        type: 'error',
        text: err?.message || 'Error saving loader to persistent store.',
      });
    } finally {
      setSaving(false);
    }
  };

  const lineCount = (code.match(/\n/g) || []).length + 1;

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-line/80 bg-[#0c0c0f] shadow-xl backdrop-blur-md">
      {/* Top Banner / Permanent Item Header */}
      <div className="border-b border-line/60 bg-white/[0.02] px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white shadow-sm">
              <Zap size={20} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-base font-bold text-white">
                  Universal Loader
                </h3>
                <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-300">
                  Permanent Global Item
                </span>
                {enabled ? (
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-950/40 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                    Active
                  </span>
                ) : (
                  <span className="rounded-full border border-amber-500/40 bg-amber-950/40 px-2 py-0.5 text-[11px] font-medium text-amber-400">
                    Disabled
                  </span>
                )}
                <span className="font-mono text-xs text-slate-400">v{version}</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                Public raw endpoint: <span className="font-mono text-zinc-300">/loader</span> &bull; Last updated: <span className="text-slate-300 font-medium">{updatedAt}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLoader}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-medium text-white hover:bg-white/20 transition-colors cursor-pointer"
              title="Copy universal loader execution command"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy loader'}</span>
            </button>

            <a
              href="/loader"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface/60 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:border-white/30 transition-colors"
              title="View public plain-text Luau endpoint"
            >
              <ExternalLink size={13} />
              <span>Raw URL</span>
            </a>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 rounded-xl border border-line bg-surface/60 p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label={isExpanded ? 'Collapse editor' : 'Expand editor'}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Configuration and Editor Body */}
      {isExpanded && (
        <div className="p-5 space-y-5">
          {/* Metadata Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-line/60 pb-5">
            {/* Version */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Version Tag
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="2.4.0"
                className="w-full rounded-xl border border-line bg-black/60 px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:border-zinc-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Shown in script stats and change trackers
              </span>
            </div>

            {/* Status Setting */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Loader Status
              </label>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setEnabled(!enabled)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    enabled ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={enabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className={`text-xs font-medium ${enabled ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {enabled ? 'Enabled (Active)' : 'Disabled (Maintenance)'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {enabled
                  ? 'Executors receive pure Luau source.'
                  : 'Executors receive safe disabled Luau notice.'}
              </span>
            </div>

            {/* Last Updated Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Last Updated
              </label>
              <div className="rounded-xl border border-line/60 bg-black/40 px-3.5 py-2 text-xs text-slate-300 flex items-center justify-between">
                <span>{updatedAt}</span>
                <span className="text-[10px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                  Auto-updated on save
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Synchronized with private Supabase Storage
              </span>
            </div>
          </div>

          {/* Luau Code Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Code2 size={15} className="text-zinc-400" />
                <span className="text-xs font-semibold text-white">
                  Luau Source Code Editor
                </span>
                <span className="rounded bg-black/60 border border-line/60 px-2 py-0.5 font-mono text-[11px] text-slate-400">
                  {lineCount} lines &bull; {code.length} chars
                </span>
              </div>

              <button
                type="button"
                onClick={handleResetToDefault}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Restore default loader code"
              >
                <RotateCcw size={12} />
                <span>Reset to default</span>
              </button>
            </div>

            <div className="relative rounded-xl border border-line bg-black p-1 focus-within:border-zinc-500">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={12}
                spellCheck={false}
                className="w-full resize-y rounded-lg bg-transparent p-3 font-mono text-xs leading-relaxed text-emerald-300 placeholder-slate-600 focus:outline-none selection:bg-white/20"
                placeholder="-- Enter Luau code here..."
              />
            </div>
          </div>

          {/* Feedback Notice */}
          {statusNotice && (
            <div
              className={`flex items-center gap-2 rounded-xl p-3 text-xs ${
                statusNotice.type === 'success'
                  ? 'border border-emerald-500/30 bg-emerald-950/40 text-emerald-200'
                  : 'border border-red-500/30 bg-red-950/40 text-red-200'
              }`}
            >
              {statusNotice.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-400 flex-none" />
              ) : (
                <AlertCircle size={16} className="text-red-400 flex-none" />
              )}
              <span>{statusNotice.text}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-slate-400">
              Stored persistently in the private Supabase Storage bucket. Changes take effect on <span className="font-mono text-zinc-300">/loader</span> immediately.
            </p>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black shadow-glow-sm hover:bg-zinc-200 disabled:opacity-60 transition-all cursor-pointer"
            >
              <Save size={14} />
              <span>{saving ? 'Saving to Storage...' : 'Save Universal Loader'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
