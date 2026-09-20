'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle, X, ShieldCheck } from 'lucide-react';

export function ClearLogsModal({
  isOpen,
  onClose,
  onConfirm,
  totalLogs,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (clearType: 'all' | 'older_7_days' | 'older_30_days') => Promise<void>;
  totalLogs: number;
}) {
  const [clearType, setClearType] = useState<'all' | 'older_7_days' | 'older_30_days'>('older_30_days');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isConfirmed = confirmText.trim().toUpperCase() === 'CLEAR';

  const handleClear = async () => {
    if (!isConfirmed) return;
    setLoading(true);
    try {
      await onConfirm(clearType);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#0c0c0f] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/30">
              <Trash2 size={20} />
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-white">Clear Execution Logs</h3>
              <p className="text-xs text-slate-400">{totalLogs} detailed log entries stored</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-surface transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="my-5 space-y-4">
          <div className="rounded-xl border border-white/20 bg-white/5 p-3.5 flex items-start gap-3">
            <ShieldCheck size={18} className="text-zinc-300 flex-none mt-0.5" />
            <p className="text-xs text-zinc-200 leading-relaxed">
              <strong>Cumulative totals are preserved:</strong> Your Total Executions counter, game distribution, and historical charts will remain 100% accurate.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select what to clear:
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-line bg-surface/40 cursor-pointer hover:border-white/40 transition-colors">
                <input
                  type="radio"
                  name="clearType"
                  value="older_30_days"
                  checked={clearType === 'older_30_days'}
                  onChange={() => setClearType('older_30_days')}
                  className="accent-white"
                />
                <div>
                  <div className="text-xs font-medium text-white">Logs older than 30 days</div>
                  <div className="text-[11px] text-slate-400">Keep recent monthly history</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-line bg-surface/40 cursor-pointer hover:border-white/40 transition-colors">
                <input
                  type="radio"
                  name="clearType"
                  value="older_7_days"
                  checked={clearType === 'older_7_days'}
                  onChange={() => setClearType('older_7_days')}
                  className="accent-white"
                />
                <div>
                  <div className="text-xs font-medium text-white">Logs older than 7 days</div>
                  <div className="text-[11px] text-slate-400">Keep past week of detailed telemetry</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-line bg-surface/40 cursor-pointer hover:border-red-500/50 transition-colors">
                <input
                  type="radio"
                  name="clearType"
                  value="all"
                  checked={clearType === 'all'}
                  onChange={() => setClearType('all')}
                  className="accent-red-500"
                />
                <div>
                  <div className="text-xs font-medium text-white">All detailed logs</div>
                  <div className="text-[11px] text-slate-400">Clear entire log history (cumulative total stays)</div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Type <span className="font-mono text-red-400 font-bold">CLEAR</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="CLEAR"
              className="w-full rounded-xl border border-line bg-black/60 px-3.5 py-2 text-xs font-mono text-white placeholder-slate-600 focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-line px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-surface transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={!isConfirmed || loading}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <Trash2 size={14} />
            <span>{loading ? 'Clearing logs...' : 'Confirm and Clear'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
