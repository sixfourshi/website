'use client';

import { useState } from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import type { Suggestion } from '@/lib/suggestions';

export function DeleteSuggestionModal({
  suggestion,
  onClose,
  onConfirmed,
}: {
  suggestion: Suggestion;
  onClose: () => void;
  onConfirmed: (id: string) => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await onConfirmed(suggestion.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete suggestion.';
      setError(msg);
      setDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-suggestion-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 py-6"
    >
      <div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-[#0d0f24] p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 flex-none">
              <AlertTriangle size={20} />
            </span>
            <div>
              <h3 id="delete-suggestion-title" className="font-display text-lg font-bold text-white">
                Delete Suggestion
              </h3>
              <p className="text-xs text-slate-300">
                Confirm permanent removal of this user suggestion
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Suggestion preview */}
        <div className="mt-5 rounded-xl border border-line/80 bg-[#060b1d] p-4 text-xs text-slate-300">
          <div className="font-semibold text-white truncate text-sm">
            {suggestion.gameName}
          </div>
          <div className="mt-2 text-slate-300 line-clamp-3 leading-relaxed italic bg-surface/40 p-2.5 rounded-lg border border-line/50">
            &ldquo;{suggestion.suggestion}&rdquo;
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            Submitted: {new Date(suggestion.createdAt).toLocaleString()}
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-950/20 p-3.5 text-xs text-red-200/90 leading-relaxed">
          This will permanently delete this suggestion from persistent storage. This action cannot be undone.
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-red-800/40 bg-red-950/40 p-2.5 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-xl border border-line px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-red-950/40 hover:bg-red-500 disabled:opacity-60 transition-all cursor-pointer"
          >
            <Trash2 size={13} />
            <span>{deleting ? 'Deleting...' : 'Confirm Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
