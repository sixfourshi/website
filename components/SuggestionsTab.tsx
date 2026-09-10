'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  Trash2,
  FilterX,
  Sparkles,
  Check,
  Calendar,
  XCircle,
  Bookmark,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { showToast } from './Toast';
import { DeleteSuggestionModal } from './DeleteSuggestionModal';
import type { Suggestion, SuggestionStatus } from '@/lib/suggestions';

interface SuggestionsTabProps {
  initialSuggestions: Suggestion[];
  onSuggestionsUpdated?: (fresh: Suggestion[]) => void;
}

export function SuggestionsTab({
  initialSuggestions,
  onSuggestionsUpdated,
}: SuggestionsTabProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggestions);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SuggestionStatus>('all');

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingSuggestion, setDeletingSuggestion] = useState<Suggestion | null>(null);

  // Filter and search
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return suggestions.filter((s) => {
      // Status filter
      if (statusFilter !== 'all' && s.status !== statusFilter) {
        return false;
      }

      // Query filter
      if (q) {
        const matchGame = s.gameName.toLowerCase().includes(q);
        const matchText = s.suggestion.toLowerCase().includes(q);
        const matchLink = s.robloxLink.toLowerCase().includes(q);
        if (!matchGame && !matchText && !matchLink) return false;
      }

      return true;
    });
  }, [suggestions, query, statusFilter]);

  // Counts by status
  const counts = useMemo(() => {
    const map: Record<string, number> = {
      all: suggestions.length,
      pending: 0,
      reviewed: 0,
      planned: 0,
      added: 0,
      rejected: 0,
    };
    for (const s of suggestions) {
      if (map[s.status] !== undefined) {
        map[s.status]++;
      }
    }
    return map;
  }, [suggestions]);

  // Handle status update
  const handleUpdateStatus = async (id: string, newStatus: SuggestionStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/suggestions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      const updatedList = suggestions.map((s) =>
        s.id === id ? { ...s, status: newStatus, updatedAt: new Date().toISOString() } : s
      );

      setSuggestions(updatedList);
      onSuggestionsUpdated?.(updatedList);

      showToast(`Status updated to "${newStatus}"`, 'success', 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating status';
      showToast(msg, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle delete confirmation
  const handleConfirmDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/suggestions/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete suggestion');
      }

      const updatedList = suggestions.filter((s) => s.id !== id);
      setSuggestions(updatedList);
      onSuggestionsUpdated?.(updatedList);

      setDeletingSuggestion(null);
      showToast('Suggestion deleted permanently', 'success', 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Deletion failed';
      showToast(msg, 'error');
      throw err;
    }
  };

  const getStatusBadge = (status: SuggestionStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            Pending
          </span>
        );
      case 'reviewed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-300">
            <Bookmark size={11} className="text-blue-400" />
            Reviewed
          </span>
        );
      case 'planned':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-300">
            <Sparkles size={11} className="text-purple-400" />
            Planned
          </span>
        );
      case 'added':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
            <CheckCircle2 size={11} className="text-emerald-400" />
            Added
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-300">
            <XCircle size={11} className="text-red-400" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div>
      {/* Top search & status filter toolbar */}
      <div className="mb-6 space-y-3.5 rounded-2xl border border-line/80 bg-[#070e24]/70 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search suggestions by game name, feature text, or link..."
              className="w-full rounded-xl border border-line/70 bg-base/80 py-2 pl-9 pr-3.5 text-xs text-white placeholder:text-slate-500 transition-colors focus:border-azure-500 focus:outline-none"
            />
          </div>

          <div className="text-xs text-slate-400">
            Showing <strong className="text-white">{filtered.length}</strong> of{' '}
            {suggestions.length} suggestions
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-[11px] font-medium text-slate-400 mr-1">Status:</span>

          <button
            onClick={() => setStatusFilter('all')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-azure-500 text-white shadow-sm'
                : 'border border-line/60 bg-base/50 text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({counts.all})
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/50'
                : 'border border-line/60 bg-base/50 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Pending ({counts.pending})
          </button>

          <button
            onClick={() => setStatusFilter('reviewed')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === 'reviewed'
                ? 'bg-blue-500/20 text-blue-200 border border-blue-500/50'
                : 'border border-line/60 bg-base/50 text-slate-400 hover:text-slate-200'
            }`}
          >
            Reviewed ({counts.reviewed})
          </button>

          <button
            onClick={() => setStatusFilter('planned')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === 'planned'
                ? 'bg-purple-500/20 text-purple-200 border border-purple-500/50'
                : 'border border-line/60 bg-base/50 text-slate-400 hover:text-slate-200'
            }`}
          >
            Planned ({counts.planned})
          </button>

          <button
            onClick={() => setStatusFilter('added')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === 'added'
                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50'
                : 'border border-line/60 bg-base/50 text-slate-400 hover:text-slate-200'
            }`}
          >
            Added ({counts.added})
          </button>

          <button
            onClick={() => setStatusFilter('rejected')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === 'rejected'
                ? 'bg-red-500/20 text-red-200 border border-red-500/50'
                : 'border border-line/60 bg-base/50 text-slate-400 hover:text-slate-200'
            }`}
          >
            Rejected ({counts.rejected})
          </button>
        </div>
      </div>

      {/* Empty State */}
      {suggestions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-12 text-center bg-surface/20">
          <MessageSquare size={32} className="mx-auto text-slate-500 mb-2" />
          <h3 className="font-semibold text-white text-sm">No suggestions yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Suggestions submitted by visitors via the public suggestion page will appear here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-12 text-center">
          <FilterX size={28} className="mx-auto text-slate-500 mb-2" />
          <h3 className="font-semibold text-white text-sm">No matching suggestions</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or status filter.
          </p>
          <button
            onClick={() => {
              setQuery('');
              setStatusFilter('all');
            }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface/60 px-3.5 py-1.5 text-xs font-medium text-azure-300 hover:bg-surface cursor-pointer"
          >
            Reset filter
          </button>
        </div>
      ) : (
        /* List of suggestions */
        <div className="space-y-4">
          {filtered.map((item) => {
            const isBusy = updatingId === item.id;

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-line/80 bg-[#0e1738]/90 p-5 shadow-sm transition-all hover:border-azure-500/40 hover:bg-[#121c45]"
              >
                {/* Top row: Game name, date, status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line/50 pb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-display text-base sm:text-lg font-bold text-white">
                      {item.gameName}
                    </h3>
                    {getStatusBadge(item.status)}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} className="text-slate-500" />
                      <span>{formatTime(item.createdAt)}</span>
                    </span>

                    {/* Open link button */}
                    <a
                      href={item.robloxLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-line bg-base/60 px-2.5 py-1 text-xs font-medium text-azure-300 hover:border-azure-500/60 hover:text-white transition-all cursor-pointer"
                      title="Open Roblox Game in new tab"
                    >
                      <span>Open Link</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>

                {/* Middle: Suggestion text */}
                <div className="my-3.5">
                  <div className="rounded-xl border border-line/60 bg-[#060b1d]/80 p-3.5 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {item.suggestion}
                  </div>
                </div>

                {/* Bottom row: Management actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/50 pt-3">
                  {/* Status update buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[11px] text-slate-400 mr-1">Actions:</span>

                    {item.status !== 'reviewed' && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'reviewed')}
                        disabled={isBusy}
                        className="rounded-lg border border-line bg-surface/50 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-surface hover:text-blue-300 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        Mark as Reviewed
                      </button>
                    )}

                    {item.status !== 'planned' && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'planned')}
                        disabled={isBusy}
                        className="rounded-lg border border-line bg-surface/50 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-surface hover:text-purple-300 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        Mark as Planned
                      </button>
                    )}

                    {item.status !== 'added' && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'added')}
                        disabled={isBusy}
                        className="rounded-lg border border-line bg-surface/50 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-surface hover:text-emerald-300 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        Mark as Added
                      </button>
                    )}

                    {item.status !== 'rejected' && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'rejected')}
                        disabled={isBusy}
                        className="rounded-lg border border-line bg-surface/50 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-surface hover:text-red-300 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        Reject
                      </button>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => setDeletingSuggestion(item)}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-950/20 px-2.5 py-1 text-xs font-medium text-red-300 hover:bg-red-900/40 hover:text-red-200 transition-colors cursor-pointer"
                    title="Permanently delete suggestion"
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deletingSuggestion && (
        <DeleteSuggestionModal
          suggestion={deletingSuggestion}
          onClose={() => setDeletingSuggestion(null)}
          onConfirmed={handleConfirmDelete}
        />
      )}
    </div>
  );
}
