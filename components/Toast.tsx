'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

const TOAST_EVENT = 'sourhub:toast';

export function showToast(
  message = 'Script copied to clipboard!',
  type: ToastType = 'success',
  duration = 3000
) {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent(TOAST_EVENT, {
    detail: { message, type, duration },
  });
  window.dispatchEvent(event);
}

export async function copyToClipboard(
  text: string,
  successMessage = 'Script copied to clipboard!'
): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      showToast(successMessage, 'success');
      return true;
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      textarea.style.top = '-999999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (successful) {
        showToast(successMessage, 'success');
        return true;
      }
      throw new Error('execCommand copy was unsuccessful');
    }
  } catch {
    showToast('Failed to copy script to clipboard.', 'error');
    return false;
  }
}

export function ToastContainer() {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const [visible, setVisible] = useState(false);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setToast(null);
    }, 250);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        message: string;
        type: ToastType;
        duration?: number;
      };

      if (timer) clearTimeout(timer);

      const newItem: ToastItem = {
        id: Math.random().toString(36).slice(2),
        message: detail.message || 'Script copied to clipboard!',
        type: detail.type || 'success',
        duration: detail.duration || 3000,
      };

      setToast(newItem);
      // Small tick to ensure animation triggers if replacing an existing toast
      requestAnimationFrame(() => {
        setVisible(true);
      });

      timer = setTimeout(() => {
        dismiss();
      }, newItem.duration);
    };

    window.addEventListener(TOAST_EVENT, handler);
    return () => {
      window.removeEventListener(TOAST_EVENT, handler);
      if (timer) clearTimeout(timer);
    };
  }, [dismiss]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 sm:bottom-6 sm:right-6 sm:left-auto sm:translate-x-0 z-50 pointer-events-none w-[90vw] max-w-sm sm:w-auto"
    >
      <div
        className={`pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3.5 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-out ${
          visible
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-3 opacity-0 scale-95'
        } ${
          isSuccess
            ? 'border-emerald-500/40 bg-[#071329]/95 text-emerald-100 shadow-emerald-950/50'
            : isError
            ? 'border-red-500/40 bg-[#1b0811]/95 text-red-100 shadow-red-950/50'
            : 'border-azure-500/40 bg-[#08122f]/95 text-azure-100 shadow-azure-950/50'
        }`}
      >
        <div className="flex-none">
          {isSuccess && (
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 size={18} />
            </span>
          )}
          {isError && (
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-red-500/20 text-red-400">
              <AlertCircle size={18} />
            </span>
          )}
          {!isSuccess && !isError && (
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-azure-500/20 text-azure-400">
              <CheckCircle2 size={18} />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white tracking-tight leading-snug">
            {toast.message}
          </p>
          <p className="text-[11px] text-slate-300 mt-0.5">
            {isSuccess
              ? 'Ready to paste into your executor'
              : isError
              ? 'Clipboard permission was blocked'
              : ''}
          </p>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="flex-none p-1 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          aria-label="Close notification"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
