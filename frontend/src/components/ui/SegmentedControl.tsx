"use client";

import { cn } from "@/lib/utils";

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  size = "md",
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex gap-1 rounded-xl border border-slate-700 bg-slate-900 p-1",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-lg transition",
              size === "md" ? "px-3.5 py-1.5 text-[13px]" : "px-3 py-1 text-[12.5px]",
              active
                ? "bg-violet-500/15 text-violet-200"
                : "text-slate-400 hover:text-slate-100",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Filter pills with an optional trailing count. */
export function FilterTabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="flex gap-1 rounded-xl border border-slate-800 bg-slate-900/70 p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[13px] transition",
              active
                ? "bg-slate-700/70 font-medium text-white"
                : "text-slate-400 hover:text-slate-100",
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={cn(
                  "ml-1.5 font-mono tabular-nums",
                  active ? "text-slate-400" : "text-slate-600",
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
