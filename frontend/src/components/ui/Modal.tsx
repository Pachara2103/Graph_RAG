"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { Icon, type IconName } from "@/components/icons";
import { Button, type ButtonVariant, CloseButton } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * Centred confirm dialog. Deliberately not a <dialog>: the console renders
 * inside a stacking context with its own sticky bars, and the native top layer
 * ignores those, so a plain fixed overlay is easier to reason about.
 *
 * It is portalled to <body> because `position: fixed` is only viewport-relative
 * while no ancestor is a containing block for it — and the Topbar sits inside a
 * `backdrop-blur-xl` header, which is exactly such an ancestor. Rendered in
 * place, that dialog was clipped to the header strip instead of covering the
 * page; from the portal every caller gets the same full-screen overlay.
 */
export function ConfirmModal({
  open,
  title,
  children,
  icon,
  tone = "primary",
  confirmLabel,
  cancelLabel = "ยกเลิก",
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  icon?: IconName;
  /** Drives the confirm button and the icon chip: primary for routine, danger to warn. */
  tone?: "primary" | "danger" | "warn";
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  // document only exists after hydration, so the portal target is resolved in
  // an effect rather than during the first (server) render.
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) onCancel();
    }
    document.addEventListener("keydown", onKeyDown);

    // The page behind must not scroll while the dialog owns the screen.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    confirmRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, loading, onCancel]);

  if (!open || !mounted) return null;

  const chip =
    tone === "danger"
      ? "border-rose-500/30 bg-rose-500/15 text-rose-300"
      : tone === "warn"
        ? "border-amber-500/30 bg-amber-500/15 text-amber-300"
        : "border-violet-500/30 bg-violet-500/15 text-violet-300";

  const confirmVariant: ButtonVariant =
    tone === "danger" ? "danger" : tone === "warn" ? "warn" : "primary";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="ปิดหน้าต่าง"
        tabIndex={-1}
        onClick={() => !loading && onCancel()}
        className="absolute inset-0 cursor-default bg-slate-950/70 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-[440px] rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl shadow-slate-950/70">
        <div className="flex items-start gap-3.5">
          {icon && (
            <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl border", chip)}>
              <Icon name={icon} className="size-5" />
            </div>
          )}
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="font-display text-[16px] font-semibold text-white">
              {title}
            </h2>
            <div className="mt-1.5 text-[13.5px] leading-relaxed text-slate-400">
              {children}
            </div>
          </div>
          <CloseButton onClick={onCancel} disabled={loading} className="-mt-1 -mr-1" />
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2.5">
          <Button onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            variant={confirmVariant}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
