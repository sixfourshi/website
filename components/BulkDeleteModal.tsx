'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface BulkDeleteModalProps {
  type: 'games' | 'scripts';
  count: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function BulkDeleteModal({
  type,
  count,
  onClose,
  onConfirm,
}: BulkDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err?.message || `Failed to delete selected ${type}.`);
      setIsDeleting(false);
    }
  };

  const title = `Delete ${count} selected ${type}? This cannot be undone.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#0e0e13] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-delete-title"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-400">
            <AlertTriangle size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 id="bulk-delete-title" className="text-base font-semibold text-white">
              {title}
            </h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Are you sure you want to permanently remove {count} selected {type === 'games' ? 'game(s)' : 'script(s)'}?
              This action will update the authoritative collection and cannot be reversed.
            </p>

            {error && (
              <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-2.5 text-xs text-red-300">
                {error}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={onClose}
                className="rounded-xl border border-line bg-surface/40 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-surface/80 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirm}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete {count} {type === 'games' ? 'Games' : 'Scripts'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
