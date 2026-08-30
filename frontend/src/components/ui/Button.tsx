import type { ComponentProps } from "react";

import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "warn"
  | "secondary"
  | "ghost"
  | "danger";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-violet-600 text-white font-semibold shadow-lg shadow-violet-950/50 hover:bg-violet-500 active:bg-violet-700",
  warn: "bg-amber-500 text-amber-950 font-semibold shadow-lg shadow-amber-950/30 hover:bg-amber-400",
  secondary:
    "border border-slate-700 bg-slate-800/60 text-slate-200 font-medium hover:border-slate-600 hover:bg-slate-800",
  ghost: "text-slate-400 font-medium hover:bg-slate-800/60 hover:text-slate-100",
  danger:
    "border border-rose-500/40 bg-rose-500/10 text-rose-200 font-medium hover:bg-rose-500/20",
};

const SIZES = {
  sm: "px-3.5 py-2 text-[13px]",
  md: "px-4 py-2.5 text-[13px]",
} as const;

interface ButtonProps extends Omit<ComponentProps<"button">, "children"> {
  variant?: ButtonVariant;
  size?: keyof typeof SIZES;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  iconRight,
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      type="button"
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl transition",
        SIZES[size],
        VARIANTS[variant],
        fullWidth && "w-full",
        isDisabled &&
          "cursor-not-allowed border-slate-800 bg-slate-800/30 text-slate-600 shadow-none hover:bg-slate-800/30",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Icon name="loader" className="size-4 animate-spin" />
      ) : (
        icon && <Icon name={icon} className="size-4" />
      )}
      {children}
      {iconRight && <Icon name={iconRight} className="size-4" />}
    </button>
  );
}

/** Square button that holds nothing but an icon. */
export function IconButton({
  icon,
  label,
  className,
  disabled,
  ...rest
}: Omit<ComponentProps<"button">, "children"> & {
  icon: IconName;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      className={cn(
        "grid size-9 place-items-center rounded-xl border transition",
        disabled
          ? "cursor-not-allowed border-slate-800 bg-slate-800/30 text-slate-600"
          : "border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-600 hover:bg-slate-800",
        className,
      )}
      {...rest}
    >
      <Icon name={icon} className="size-4" />
    </button>
  );
}

/** Borderless close affordance used in the corner of inline forms. */
export function CloseButton({
  className,
  ...rest
}: Omit<ComponentProps<"button">, "children">) {
  return (
    <button
      type="button"
      aria-label="ปิด"
      className={cn(
        "grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-slate-200",
        className,
      )}
      {...rest}
    >
      <Icon name="x" className="size-4" />
    </button>
  );
}
