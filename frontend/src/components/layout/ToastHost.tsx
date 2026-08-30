"use client";

import { useEffect } from "react";

import { Alert } from "@/components/ui/Alert";
import { useConsole } from "@/store/console-store";

const AUTO_DISMISS_MS = 3000;

/**
 * The single notification slot for the whole console. Rendered inside the
 * sticky topbar wrapper and pinned to its bottom edge, so it stays in view no
 * matter how far the panel underneath is scrolled.
 *
 * The store holds at most one toast, so a burst of notifications collapses to
 * whichever arrived last — and because every dispatch site builds a fresh
 * toast object, the effect below re-runs and restarts the countdown even when
 * two identical messages land back to back.
 */
export function ToastHost() {
  const { toast, clearToast } = useConsole();

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(clearToast, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    // `top-full` hangs this off the wrapper's bottom edge instead of taking up
    // flow space, so showing a toast never shifts the panel below it.
    <div className="pointer-events-none absolute inset-x-0 top-full px-5 sm:px-8">
      <div className="mx-auto mt-3 w-full max-w-[1200px] overflow-hidden rounded-xl bg-slate-900/95 shadow-lg shadow-slate-950/50 backdrop-blur-xl">
        <Alert
          className="pointer-events-auto"
          tone={toast.kind}
          title={toast.message}
          onDismiss={clearToast}
        />
      </div>
    </div>
  );
}
