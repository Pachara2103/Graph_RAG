import type { ReactNode } from "react";

import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/utils";

export type AlertTone = "success" | "error" | "warn" | "info" | "loading";

const TONES: Record<
  AlertTone,
  { box: string; icon: IconName; iconColor: string; text: string }
> = {
  success: {
    box: "border-emerald-500/30 bg-emerald-500/10",
    icon: "check-circle",
    iconColor: "text-emerald-400",
    text: "text-emerald-200",
  },
  error: {
    box: "border-rose-500/30 bg-rose-500/10",
    icon: "alert",
    iconColor: "text-rose-400",
    text: "text-rose-200",
  },
  warn: {
    box: "border-amber-500/30 bg-amber-500/10",
    icon: "alert",
    iconColor: "text-amber-400",
    text: "text-amber-200",
  },
  info: {
    box: "border-slate-700 bg-slate-800/40",
    icon: "info",
    iconColor: "text-slate-400",
    text: "text-slate-300",
  },
  loading: {
    box: "border-slate-700 bg-slate-800/40",
    icon: "loader",
    iconColor: "text-violet-400",
    text: "text-slate-200",
  },
};

export function Alert({
  tone,
  title,
  detail,
  onDismiss,
  trailing,
  className,
}: {
  tone: AlertTone;
  title: ReactNode;
  detail?: ReactNode;
  onDismiss?: () => void;
  trailing?: ReactNode;
  className?: string;
}) {
  const spec = TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3",
        spec.box,
        className,
      )}
    >
      <Icon
        name={spec.icon}
        className={cn(
          "size-[18px] shrink-0",
          spec.iconColor,
          tone === "loading" && "animate-spin",
        )}
      />
      <div className="min-w-0 flex-1">
        <p className={cn("text-[13.5px] font-medium", spec.text)}>{title}</p>
        {detail && (
          <p className="truncate text-[12px] text-slate-400">{detail}</p>
        )}
      </div>
      {trailing}
      {onDismiss && (
        <button
          type="button"
          aria-label="ปิดข้อความ"
          onClick={onDismiss}
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-lg transition hover:bg-white/5",
            spec.text,
          )}
        >
          <Icon name="x" className="size-4" />
        </button>
      )}
    </div>
  );
}

/** Quieter inline note used underneath form fields. */
export function InlineNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2.5">
      <Icon name="info" className="mt-0.5 size-4 shrink-0 text-slate-500" />
      <p className="text-[12px] leading-relaxed text-slate-400">{children}</p>
    </div>
  );
}
