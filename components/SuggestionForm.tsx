'use client';

import { useState, useRef, type FormEvent } from 'react';
import { Send, Loader2, Link2, Gamepad2, MessageSquarePlus, Sparkles, CheckCircle2 } from 'lucide-react';
import { showToast } from './Toast';

export function SuggestionForm() {
  const [gameName, setGameName] = useState('');
  const [robloxLink, setRobloxLink] = useState('');
  const [suggestion, setSuggestion] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Client-side quick checks
    const trimmedGame = gameName.trim();
    const trimmedLink = robloxLink.trim();
    const trimmedSug = suggestion.trim();

    if (!trimmedGame) {
      showToast('Please enter the Roblox game name.', 'error');
      return;
    }

    if (!trimmedLink) {
      showToast('Please provide a Roblox game link.', 'error');
      return;
    }

    if (!trimmedSug) {
      showToast('Please describe your requested features or script idea.', 'error');
      return;
    }

    setIsSubmitting(true);
    setIsSuccess(false);

    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameName: trimmedGame,
          robloxLink: trimmedLink,
          suggestion: trimmedSug,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Submission failed. Please try again.');
      }

      // Success: completely clear all three form fields
      setGameName('');
      setRobloxLink('');
      setSuggestion('');

      // Remove focus from any active form elements so text does not linger
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      // Set temporary success indicator and trigger polished toast
      setIsSuccess(true);
      showToast('Suggestion submitted successfully!', 'success', 4000, 'Our team will review your request.');

      // Fade out success banner after a few seconds
      setTimeout(() => {
        setIsSuccess(false);
      }, 6000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit suggestion.';
      showToast(msg, 'error', 4500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="rounded-3xl border border-line bg-[#0c0c0f] p-6 sm:p-10 shadow-2xl shadow-black/80 backdrop-blur-xl transition-all">
        {/* Glowing badge */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3.5 py-1 text-xs font-medium text-zinc-300">
            <Sparkles size={12} className="text-zinc-400" />
            <span>Community Requests</span>
          </div>
        </div>

        {/* Headline & Description */}
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white text-center">
          Suggest a Game or Feature
        </h1>

        <p className="mt-3 text-center text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
          Have a game you want us to support or a feature you would like added? Send us your suggestion
          and we’ll review it for a future Nova Hub update.
        </p>

        {/* Success Notice Banner */}
        {isSuccess && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-200 animate-in fade-in duration-300">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <div className="leading-relaxed">
              <span className="font-semibold text-white">Thank you!</span> Your suggestion has been
              received and queued for review in our administration dashboard.
            </div>
          </div>
        )}

        {/* The Centered Suggestion Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="mt-8 space-y-5">
          {/* Game Name */}
          <div>
            <label htmlFor="game-name-input" className="block text-xs font-medium text-slate-200 mb-2">
              <span className="flex items-center gap-1.5">
                <Gamepad2 size={13} className="text-zinc-400" />
                <span>Game Name</span>
                <span className="text-zinc-500">*</span>
              </span>
            </label>
            <input
              id="game-name-input"
              type="text"
              required
              disabled={isSubmitting}
              value={gameName}
              maxLength={100}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="e.g. Blade Ball, Rivals, Deepwoken, Da Hood"
              className="w-full rounded-xl border border-line bg-black/60 px-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 transition-all focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/40 disabled:opacity-50"
            />
          </div>

          {/* Roblox Game Link */}
          <div>
            <label htmlFor="roblox-link-input" className="block text-xs font-medium text-slate-200 mb-2">
              <span className="flex items-center gap-1.5">
                <Link2 size={13} className="text-zinc-400" />
                <span>Roblox Game Link</span>
                <span className="text-zinc-500">*</span>
              </span>
            </label>
            <input
              id="roblox-link-input"
              type="url"
              required
              disabled={isSubmitting}
              value={robloxLink}
              maxLength={300}
              onChange={(e) => setRobloxLink(e.target.value)}
              placeholder="https://www.roblox.com/games/13772394625/..."
              className="w-full rounded-xl border border-line bg-black/60 px-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 transition-all focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/40 disabled:opacity-50"
            />
            <p className="mt-1.5 text-[11px] text-slate-400">
              Paste the experience link directly from <strong className="text-slate-300">roblox.com/games/...</strong>
            </p>
          </div>

          {/* Suggestion Text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="suggestion-textarea" className="block text-xs font-medium text-slate-200">
                <span className="flex items-center gap-1.5">
                  <MessageSquarePlus size={13} className="text-zinc-400" />
                  <span>Suggestion</span>
                  <span className="text-zinc-500">*</span>
                </span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {suggestion.length}/2000
              </span>
            </div>
            <textarea
              id="suggestion-textarea"
              required
              disabled={isSubmitting}
              rows={5}
              maxLength={2000}
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="Describe the requested features, exploits, ESP options, auto-farm routines, or script improvements you would like to see supported..."
              className="w-full rounded-xl border border-line bg-black/60 px-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 transition-all focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/40 disabled:opacity-50 leading-relaxed resize-y"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              ref={submitBtnRef}
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-xs sm:text-sm font-semibold text-black shadow-sm hover:bg-zinc-200 transition-all disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Submitting…</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Submit Suggestion</span>
                </>
              )}
            </button>
          </div>

          <p className="text-center text-[11px] text-blue-200/70 pt-1">
            All suggestions are saved securely and reviewed by the Nova Hub development team.
          </p>
        </form>
      </div>
    </div>
  );
}
