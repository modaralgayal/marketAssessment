import type { ReactNode } from "react";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button red and is used for the copy/intent. */
  destructive?: boolean;
  /** Disables the confirm button (e.g. while the action is in flight). */
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Lightweight, branded confirmation dialog (no external dependency). Used for
 * destructive admin actions like deleting an account. Closes on overlay click
 * or Cancel; Enter is not auto-wired so it stays an explicit choice.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  pending = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmCls = destructive
    ? "rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
    : "rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-teal-dark disabled:opacity-50";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-brand-line bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold text-brand-ink">{title}</h2>
        {description ? <div className="mt-2 text-sm text-brand-muted">{description}</div> : null}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-full border border-brand-line px-4 py-2 text-sm font-medium text-brand-muted hover:border-brand-teal hover:text-brand-teal disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={pending} className={confirmCls}>
            {pending ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
