'use client';

import { useState } from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';
import type { RobloxGame } from '@/lib/games';

export function DeleteGameModal({
  game,
  associatedScriptCount,
  onClose,
  onConfirmed,
}: {
  game: RobloxGame;
  associatedScriptCount: number;
  onClose: () => void;
  onConfirmed: (slug: string, scriptAction: 'keep' | 'reassign' | 'delete') => Promise<void>;
}) {
  const [scriptAction, setScriptAction] = useState<'reassign' | 'keep' | 'delete'>('reassign');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await onConfirmed(game.slug, scriptAction);
    } catch (err: any) {
      setError(err.message || 'Failed to delete game.');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 py-6">
      <div className="w-full max-w-lg rounded-2xl border border-red-500/40 bg-[#0d0f24] p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 flex-none">
              <AlertTriangle size={20} />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                Delete Game
              </h3>
              <p className="text-xs text-slate-300">
                Confirm deletion for <span className="font-semibold text-red-300">{game.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {associatedScriptCount > 0 ? (
          <>
            {/* Warning card for scripts */}
            <div className="mt-5 rounded-xl border border-line/80 bg-[#060b1d] p-4 text-xs text-slate-300">
              <div className="flex items-center gap-2 font-medium text-white mb-1">
                <ShieldAlert size={14} className="text-amber-400" />
                <span>Associated Scripts Protection</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                There are currently{' '}
                <strong className="text-azure-300">{associatedScriptCount} standalone script(s)</strong> tagged with this game. How would you like to handle them?
              </p>
            </div>

            {/* Strategy options */}
            <div className="mt-4 space-y-2.5">
              <label
                className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
                  scriptAction === 'reassign'
                    ? 'border-azure-500/60 bg-azure-950/30 text-white'
                    : 'border-line/60 bg-[#070e24]/60 text-slate-300 hover:border-line'
                }`}
              >
                <input
                  type="radio"
                  name="scriptAction"
                  value="reassign"
                  checked={scriptAction === 'reassign'}
                  onChange={() => setScriptAction('reassign')}
                  className="mt-0.5 text-azure-500 focus:ring-azure-500"
                />
                <div>
                  <div className="font-semibold text-xs text-white">
                    Reassign scripts to Universal (Recommended)
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Protects the scripts from being lost. They will now appear under Universal Scripts.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
                  scriptAction === 'keep'
                    ? 'border-azure-500/60 bg-azure-950/30 text-white'
                    : 'border-line/60 bg-[#070e24]/60 text-slate-300 hover:border-line'
                }`}
              >
                <input
                  type="radio"
                  name="scriptAction"
                  value="keep"
                  checked={scriptAction === 'keep'}
                  onChange={() => setScriptAction('keep')}
                  className="mt-0.5 text-azure-500 focus:ring-azure-500"
                />
                <div>
                  <div className="font-semibold text-xs text-white">
                    Keep scripts unchanged
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Leaves existing scripts in the database with their current game identifier ({game.slug}).
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
                  scriptAction === 'delete'
                    ? 'border-red-500/60 bg-red-950/30 text-white'
                    : 'border-line/60 bg-[#070e24]/60 text-slate-300 hover:border-line'
                }`}
              >
                <input
                  type="radio"
                  name="scriptAction"
                  value="delete"
                  checked={scriptAction === 'delete'}
                  onChange={() => setScriptAction('delete')}
                  className="mt-0.5 text-red-500 focus:ring-red-500"
                />
                <div>
                  <div className="font-semibold text-xs text-red-300">
                    Delete associated scripts too
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Permanently removes all {associatedScriptCount} scripts that belong to this game.
                  </div>
                </div>
              </label>
            </div>
          </>
        ) : (
          <div className="mt-5 rounded-xl border border-line/80 bg-[#060b1d] p-4 text-xs text-slate-300 leading-relaxed">
            This will permanently remove <strong className="text-white">&ldquo;{game.name}&rdquo;</strong> and all of its configured tabs, sections, and features from persistent storage.
          </div>
        )}

        {error && (
          <p className="mt-3 text-xs text-red-400 bg-red-950/30 p-2.5 rounded-lg border border-red-800/40">
            {error}
          </p>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-xl border border-line px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-red-950/40 hover:bg-red-500 disabled:opacity-60 transition-all cursor-pointer"
          >
            {deleting ? 'Deleting...' : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
