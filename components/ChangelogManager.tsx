'use client';

import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Calendar,
  Layers,
  X,
  ListPlus,
  Loader2,
} from 'lucide-react';
import type { ChangelogRelease, ChangelogSection } from '@/lib/changelog';

interface Props {
  initialReleases: ChangelogRelease[];
}

export function ChangelogManager({ initialReleases }: Props) {
  const [releases, setReleases] = useState<ChangelogRelease[]>(initialReleases);
  const [editingRelease, setEditingRelease] = useState<ChangelogRelease | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ChangelogRelease | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const refreshReleases = async () => {
    try {
      const res = await fetch('/api/changelog', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setReleases(data);
      }
    } catch {
      // silent refresh fail
    }
  };

  const handleMarkLatest = async (release: ChangelogRelease) => {
    try {
      const res = await fetch('/api/changelog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-latest', id: release.id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to mark latest');
      }

      const updated = await res.json();
      setReleases(updated);
      showToast(`Marked ${release.version} as the latest release.`);
    } catch (err: any) {
      showToast(err.message || 'Error updating latest status', 'error');
    }
  };

  const handleMoveRelease = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= releases.length) return;

    const reordered = [...releases];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    // Optimistic update
    setReleases(reordered);

    try {
      const res = await fetch('/api/changelog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reorder',
          orderedIds: reordered.map((r) => r.id),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save order');
      }
      showToast('Changelog order updated.');
    } catch {
      showToast('Failed to save release reorder', 'error');
      refreshReleases();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/changelog/${deleteTarget.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete release');
      }

      setReleases((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      showToast(`Deleted release ${deleteTarget.version}.`);
      setDeleteTarget(null);
    } catch (err: any) {
      showToast(err.message || 'Error deleting release', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveRelease = async (releaseData: Partial<ChangelogRelease>) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/changelog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(releaseData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save release');
      }

      await refreshReleases();
      showToast(
        releaseData.id
          ? `Updated release ${releaseData.version}.`
          : `Created release ${releaseData.version}.`
      );
      setEditingRelease(null);
      setIsCreating(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to save release', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur-md transition-all ${
            toast.type === 'error'
              ? 'border-red-500/40 bg-red-950/90 text-red-200'
              : 'border-emerald-500/40 bg-emerald-950/90 text-emerald-200'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-line/80 bg-[#0a112c]/80 p-5 backdrop-blur-md">
        <div>
          <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <span>Changelog Management</span>
            <span className="rounded-full border border-azure-500/40 bg-azure-950/60 px-2.5 py-0.5 text-xs font-normal text-azure-300">
              {releases.length} {releases.length === 1 ? 'Release' : 'Releases'}
            </span>
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Publish version notes, organize sections, and manage the public changelog.
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreating(true);
            setEditingRelease(null);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-azure-500 px-4 py-2.5 text-xs font-medium text-white shadow-glow-sm transition-all hover:bg-azure-400 hover:shadow-glow"
        >
          <Plus size={15} />
          <span>Add Release</span>
        </button>
      </div>

      {/* Releases List */}
      <div className="space-y-4">
        {releases.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line/80 bg-[#081028]/50 p-10 text-center">
            <Layers className="mx-auto h-8 w-8 text-slate-500" />
            <h3 className="mt-2 text-sm font-medium text-white">No releases yet</h3>
            <p className="mt-1 text-xs text-slate-400">
              Click &quot;Add Release&quot; to publish your first changelog entry.
            </p>
          </div>
        ) : (
          releases.map((release, idx) => (
            <div
              key={release.id}
              className="group rounded-2xl border border-line/80 bg-[#0e1738]/90 p-5 shadow-sm transition-all hover:border-azure-500/40 hover:bg-[#111c44]"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-display text-lg font-bold text-white">
                      {release.version.startsWith('v') ? release.version : `v${release.version}`}
                    </span>
                    {release.isLatest ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                        <Sparkles size={11} />
                        LATEST
                      </span>
                    ) : (
                      <button
                        onClick={() => handleMarkLatest(release)}
                        className="rounded-full border border-line/60 bg-[#060b1e] px-2 py-0.5 text-[10px] text-slate-400 transition-colors hover:border-azure-500/40 hover:text-azure-300"
                        title="Mark this release as Latest"
                      >
                        Set as Latest
                      </button>
                    )}
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Calendar size={12} />
                      {release.date}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-300 max-w-2xl">
                    {release.summary}
                  </p>

                  {/* Sections preview count */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                    <span className="rounded bg-[#060b1e] px-2 py-0.5 border border-line/40">
                      {release.sections?.length || 0} {(release.sections?.length === 1 ? 'section' : 'sections')}
                    </span>
                    <span className="rounded bg-[#060b1e] px-2 py-0.5 border border-line/40">
                      {(release.sections || []).reduce((sum, s) => sum + (s.changes?.length || 0), 0)} changes
                    </span>
                  </div>
                </div>

                {/* Actions & Reorder controls */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    onClick={() => handleMoveRelease(idx, 'up')}
                    disabled={idx === 0}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-slate-400 hover:border-azure-600 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <ArrowUp size={13} />
                  </button>

                  <button
                    onClick={() => handleMoveRelease(idx, 'down')}
                    disabled={idx === releases.length - 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-slate-400 hover:border-azure-600 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <ArrowDown size={13} />
                  </button>

                  <button
                    onClick={() => {
                      setEditingRelease(release);
                      setIsCreating(false);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-slate-400 hover:border-azure-600 hover:text-white transition-colors"
                    title="Edit release"
                  >
                    <Pencil size={13} />
                  </button>

                  <button
                    onClick={() => setDeleteTarget(release)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-slate-400 hover:border-red-600 hover:text-red-400 transition-colors"
                    title="Delete release"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Sections detail preview accordion */}
              {release.sections && release.sections.length > 0 && (
                <div className="mt-4 border-t border-line/40 pt-3 space-y-2">
                  {release.sections.map((sec) => (
                    <div key={sec.id || sec.title} className="text-xs">
                      <span className="font-bold text-azure-400 uppercase tracking-wider text-[10px]">
                        {sec.title}:
                      </span>{' '}
                      <span className="text-slate-400">
                        {sec.changes.length} {sec.changes.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Edit / Create Modal */}
      {(isCreating || editingRelease) && (
        <ReleaseModal
          initialData={editingRelease}
          isSaving={isSaving}
          onSave={handleSaveRelease}
          onClose={() => {
            setIsCreating(false);
            setEditingRelease(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#0c1330] p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-white">
              Delete Release {deleteTarget.version}?
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              Are you sure you want to permanently delete this release from the changelog? This action cannot be undone and changes are saved directly to persistent storage.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="rounded-xl border border-line px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                <span>Delete Release</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ModalProps {
  initialData: ChangelogRelease | null;
  isSaving: boolean;
  onSave: (data: Partial<ChangelogRelease>) => void;
  onClose: () => void;
}

function ReleaseModal({ initialData, isSaving, onSave, onClose }: ModalProps) {
  const [version, setVersion] = useState(initialData?.version || 'v1.0.0');
  const [date, setDate] = useState(
    initialData?.date || new Date().toISOString().split('T')[0]
  );
  const [summary, setSummary] = useState(initialData?.summary || '');
  const [isLatest, setIsLatest] = useState(Boolean(initialData?.isLatest));
  const [sections, setSections] = useState<ChangelogSection[]>(
    initialData?.sections && initialData.sections.length > 0
      ? initialData.sections
      : [
          {
            id: `sec-${Date.now()}`,
            title: 'GENERAL',
            changes: ['Initial release updates.'],
          },
        ]
  );

  const [newChangeTexts, setNewChangeTexts] = useState<Record<string, string>>({});

  const handleAddSection = () => {
    const newSec: ChangelogSection = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: 'NEW SECTION',
      changes: [''],
    };
    setSections([...sections, newSec]);
  };

  const handleRemoveSection = (sectionId: string) => {
    setSections(sections.filter((s) => s.id !== sectionId));
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    const reordered = [...sections];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    setSections(reordered);
  };

  const handleUpdateSectionTitle = (sectionId: string, title: string) => {
    setSections(
      sections.map((s) => (s.id === sectionId ? { ...s, title } : s))
    );
  };

  const handleAddChangeToSection = (sectionId: string) => {
    const text = (newChangeTexts[sectionId] || '').trim();
    if (!text) return;

    setSections(
      sections.map((s) =>
        s.id === sectionId ? { ...s, changes: [...s.changes, text] } : s
      )
    );
    setNewChangeTexts({ ...newChangeTexts, [sectionId]: '' });
  };

  const handleUpdateChange = (sectionId: string, changeIndex: number, text: string) => {
    setSections(
      sections.map((s) => {
        if (s.id !== sectionId) return s;
        const updated = [...s.changes];
        updated[changeIndex] = text;
        return { ...s, changes: updated };
      })
    );
  };

  const handleRemoveChange = (sectionId: string, changeIndex: number) => {
    setSections(
      sections.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          changes: s.changes.filter((_, idx) => idx !== changeIndex),
        };
      })
    );
  };

  const handleMoveChange = (
    sectionId: string,
    changeIndex: number,
    direction: 'up' | 'down'
  ) => {
    setSections(
      sections.map((s) => {
        if (s.id !== sectionId) return s;
        const target = direction === 'up' ? changeIndex - 1 : changeIndex + 1;
        if (target < 0 || target >= s.changes.length) return s;
        const updated = [...s.changes];
        const [moved] = updated.splice(changeIndex, 1);
        updated.splice(target, 0, moved);
        return { ...s, changes: updated };
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!version.trim() || !date.trim() || !summary.trim()) return;

    // Filter empty changes
    const cleanedSections = sections
      .map((s) => ({
        ...s,
        title: s.title.trim().toUpperCase() || 'GENERAL',
        changes: s.changes.map((c) => c.trim()).filter(Boolean),
      }))
      .filter((s) => s.changes.length > 0);

    onSave({
      ...(initialData?.id ? { id: initialData.id } : {}),
      version: version.trim(),
      date: date.trim(),
      summary: summary.trim(),
      isLatest,
      sections: cleanedSections,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-line/80 bg-[#0a112c] p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-line/60 pb-4">
          <h3 className="font-display text-lg font-bold text-white">
            {initialData ? `Edit Release ${initialData.version}` : 'New Release'}
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-slate-400 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Version, Date & Latest */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Version <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="v9.6.26"
                required
                className="w-full rounded-xl border border-line bg-[#060b1e] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-azure-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Release Date <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="2026-09-06"
                required
                className="w-full rounded-xl border border-line bg-[#060b1e] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-azure-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 rounded-xl border border-line/60 bg-[#060b1e] px-3 py-2 text-xs text-slate-200 cursor-pointer hover:border-azure-500/50">
                <input
                  type="checkbox"
                  checked={isLatest}
                  onChange={(e) => setIsLatest(e.target.checked)}
                  className="rounded border-line bg-[#0a112c] text-azure-500 focus:ring-azure-500"
                />
                <span className="font-medium">Mark as Latest Release</span>
              </label>
            </div>
          </div>

          {/* Short Summary */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Short Summary <span className="text-red-400">*</span>
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Lobby quality-of-life improvements and smarter automation."
              rows={2}
              required
              className="w-full rounded-xl border border-line bg-[#060b1e] p-3 text-xs text-white placeholder-slate-500 focus:border-azure-500 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Sections Manager */}
          <div className="space-y-4 border-t border-line/60 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-azure-400">
                  Sections & Bullet Changes
                </h4>
                <p className="text-[11px] text-slate-400">
                  Organize changes into titled sections (e.g. LOBBY, MOVEMENT).
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddSection}
                className="inline-flex items-center gap-1.5 rounded-lg border border-azure-500/40 bg-azure-950/40 px-3 py-1.5 text-xs font-medium text-azure-300 hover:bg-azure-900/60 transition-colors"
              >
                <Plus size={13} />
                <span>Add Section</span>
              </button>
            </div>

            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              {sections.map((section, sIdx) => (
                <div
                  key={section.id}
                  className="rounded-xl border border-line/80 bg-[#081028] p-4 space-y-3"
                >
                  {/* Section Title & Controls */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-slate-500 text-xs font-mono select-none">
                        #{sIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => handleUpdateSectionTitle(section.id, e.target.value)}
                        placeholder="SECTION TITLE (e.g. LOBBY)"
                        className="w-full max-w-xs rounded-lg border border-line bg-[#060b1e] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-azure-300 placeholder-slate-500 focus:border-azure-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveSection(sIdx, 'up')}
                        disabled={sIdx === 0}
                        className="flex h-7 w-7 items-center justify-center rounded border border-line text-slate-400 hover:text-white disabled:opacity-30"
                        title="Move section up"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSection(sIdx, 'down')}
                        disabled={sIdx === sections.length - 1}
                        className="flex h-7 w-7 items-center justify-center rounded border border-line text-slate-400 hover:text-white disabled:opacity-30"
                        title="Move section down"
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(section.id)}
                        disabled={sections.length <= 1}
                        className="flex h-7 w-7 items-center justify-center rounded border border-line text-slate-400 hover:text-red-400 disabled:opacity-30"
                        title="Remove section"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Bullet Changes */}
                  <div className="space-y-2 pl-2">
                    {section.changes.map((change, cIdx) => (
                      <div key={cIdx} className="flex items-center gap-2">
                        <span className="text-azure-400 select-none">•</span>
                        <input
                          type="text"
                          value={change}
                          onChange={(e) =>
                            handleUpdateChange(section.id, cIdx, e.target.value)
                          }
                          placeholder="e.g. Auto Sell now has separate rarity lists."
                          className="flex-1 rounded-lg border border-line/60 bg-[#060b1e] px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-azure-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleMoveChange(section.id, cIdx, 'up')}
                          disabled={cIdx === 0}
                          className="flex h-6 w-6 items-center justify-center rounded border border-line/40 text-slate-400 hover:text-white disabled:opacity-25"
                          title="Move bullet up"
                        >
                          <ArrowUp size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveChange(section.id, cIdx, 'down')}
                          disabled={cIdx === section.changes.length - 1}
                          className="flex h-6 w-6 items-center justify-center rounded border border-line/40 text-slate-400 hover:text-white disabled:opacity-25"
                          title="Move bullet down"
                        >
                          <ArrowDown size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveChange(section.id, cIdx)}
                          className="flex h-6 w-6 items-center justify-center rounded border border-line/40 text-slate-400 hover:text-red-400"
                          title="Remove bullet"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}

                    {/* Add new change input */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={newChangeTexts[section.id] || ''}
                        onChange={(e) =>
                          setNewChangeTexts({
                            ...newChangeTexts,
                            [section.id]: e.target.value,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddChangeToSection(section.id);
                          }
                        }}
                        placeholder="Type a new bullet point and press Enter or Add..."
                        className="flex-1 rounded-lg border border-line/60 bg-[#060b1e]/60 px-2.5 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:border-azure-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddChangeToSection(section.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-surface px-2.5 py-1.5 text-xs font-medium text-azure-300 hover:bg-azure-900/40 transition-colors"
                      >
                        <ListPlus size={13} />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-line/60 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-line px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-azure-500 px-5 py-2 text-xs font-medium text-white shadow-glow-sm hover:bg-azure-400 transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
              <span>{initialData ? 'Save Changes' : 'Publish Release'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
