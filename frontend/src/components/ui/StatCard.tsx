import type { ReactNode } from "react";

import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/utils";

export type StatTone = "neutral" | "matched" | "unmatched" | "pending";

const TONES: Record<
  StatTone,
  { box: string; label: string; icon: string; value: string; bar: string }
> = {
  neutral: {
    box: "border-slate-800 bg-slate-800/30",
    label: "text-slate-500",
    icon: "text-slate-600",
    value: "text-white",
    bar: "bg-slate-400",
  },
  matched: {
    box: "border-emerald-500/20 bg-emerald-500/[0.06]",
    label: "text-emerald-400/70",
    icon: "text-emerald-500/70",
    value: "text-emerald-300",
    bar: "bg-emerald-400",
  },
  unmatched: {
    box: "border-amber-500/20 bg-amber-500/[0.06]",
    label: "text-amber-400/70",
    icon: "text-amber-500/70",
    value: "text-amber-300",
    bar: "bg-amber-400",
  },
  pending: {
    box: "border-violet-500/20 bg-violet-500/[0.06]",
    label: "text-violet-400/70",
    icon: "text-violet-400/70",
    value: "text-violet-200",
    bar: "bg-violet-400",
  },
};

export function StatCard({
  label,
  value,
  icon,
  tone = "neutral",
  footnote,
  progress,
}: {
  label: string;
  value: number | string;
  icon: IconName;
  tone?: StatTone;
  footnote?: ReactNode;
  /** 0-100. Renders a bar in place of the footnote row. */
  progress?: number;
}) {
  const spec = TONES[tone];
  return (
    <div className={cn("rounded-2xl border p-4", spec.box)}>
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "font-mono text-[10px] uppercase tracking-[0.14em]",
            spec.label,
          )}
        >
          {label}
        </span>
        <Icon name={icon} className={cn("size-4 shrink-0", spec.icon)} />
      </div>
      <div
        className={cn(
          "mt-2 font-display text-[28px] leading-none font-semibold tabular-nums",
          spec.value,
        )}
      >
        {value}
      </div>
      {progress !== undefined ? (
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-900/60">
          <div
            className={cn("h-full rounded-full", spec.bar)}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      ) : (
        footnote && (
          <p className={cn("mt-2 text-[11px]", spec.label)}>{footnote}</p>
        )
      )}
    </div>
  );
}
