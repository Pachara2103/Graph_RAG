import type { ReactNode } from "react";

import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  detail,
  action,
  tone = "neutral",
}: {
  icon: IconName;
  title: string;
  detail?: string;
  action?: ReactNode;
  /** `success` is used for the all-groups-linked case, which is good news. */
  tone?: "neutral" | "success";
}) {
  const success = tone === "success";
  return (
    <div
      className={cn(
        "grid place-items-center rounded-2xl border px-6 py-10 text-center",
        success
          ? "border-emerald-500/25 bg-emerald-500/[0.06]"
          : "border-dashed border-slate-700 bg-slate-800/20",
      )}
    >
      <div
        className={cn(
          "grid size-12 place-items-center rounded-2xl border",
          success
            ? "border-emerald-500/30 bg-emerald-500/10"
            : "border-slate-700 bg-slate-800/60",
        )}
      >
        <Icon
          name={icon}
          className={cn("size-5", success ? "text-emerald-400" : "text-slate-500")}
        />
      </div>
      <p
        className={cn(
          "mt-3.5 font-display text-[15px] font-semibold",
          success ? "text-emerald-200" : "text-slate-200",
        )}
      >
        {title}
      </p>
      {detail && (
        <p
          className={cn(
            "mt-1 max-w-[36ch] text-[12.5px]",
            success ? "text-emerald-300/60" : "text-slate-500",
          )}
        >
          {detail}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function GroupCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-800/20 p-4">
      <div className="size-11 shrink-0 animate-pulse rounded-xl bg-slate-700/50" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-2/5 animate-pulse rounded bg-slate-700/50" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-slate-700/30" />
      </div>
      <div className="h-9 w-24 shrink-0 animate-pulse rounded-xl bg-slate-700/40" />
    </div>
  );
}
