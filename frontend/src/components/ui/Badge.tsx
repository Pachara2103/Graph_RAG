import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type BadgeTone =
  | "matched"
  | "unmatched"
  | "pending"
  | "completed"
  | "neutral"
  | "muted";

const TONES: Record<BadgeTone, string> = {
  matched: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  unmatched: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  pending: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  neutral: "border-slate-600/60 bg-slate-700/40 text-slate-300",
  muted: "border-slate-700 bg-slate-800 text-slate-500 italic",
};

const DOTS: Partial<Record<BadgeTone, string>> = {
  matched: "bg-emerald-400",
  unmatched: "bg-amber-400",
};

export function Badge({
  tone = "neutral",
  dot = false,
  className,
  children,
}: {
  tone?: BadgeTone;
  /** Adds the small status dot used on the matched / unmatched pills. */
  dot?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        TONES[tone],
        className,
      )}
    >
      {dot && DOTS[tone] && (
        <span className={cn("size-1.5 rounded-full", DOTS[tone])} />
      )}
      {children}
    </span>
  );
}

/** Monospace count chip that sits next to a section heading. */
export function CountChip({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium tabular-nums",
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}
