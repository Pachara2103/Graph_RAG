import type { ReactNode } from "react";

import { Icon } from "@/components/icons";
import { MESSAGES } from "@/lib/constants";
import { cn, companyLabel } from "@/lib/utils";
import type { GroupLine } from "@/types";

/**
 * The link / unlink chip. The whole system reads matched state from this one
 * colour pair, so it stays separate from the violet accent.
 */
export function GroupChip({
  matched,
  size = "md",
  dim = false,
}: {
  matched: boolean;
  size?: "sm" | "md";
  /** Used for groups where nothing is pending any more. */
  dim?: boolean;
}) {
  const box = size === "md" ? "size-11 rounded-xl" : "size-10 rounded-lg";
  const glyph = size === "md" ? "size-5" : "size-[18px]";

  if (dim) {
    return (
      <div
        className={cn(
          "grid shrink-0 place-items-center border border-slate-700/60 bg-slate-800/60",
          box,
        )}
      >
        <Icon name="check-circle" className={cn(glyph, "text-slate-500")} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center border",
        box,
        matched
          ? "border-emerald-500/25 bg-emerald-500/10"
          : "border-amber-500/25 bg-amber-500/10",
      )}
    >
      <Icon
        name={matched ? "link" : "unlink"}
        className={cn(glyph, matched ? "text-emerald-400" : "text-amber-400")}
      />
    </div>
  );
}

/** Group name, status badges and the company caption underneath. */
export function GroupIdentity({
  group,
  badges,
  titleSize = "md",
  muted = false,
  highlight,
  onCompanyClick,
}: {
  group: GroupLine;
  badges?: ReactNode;
  titleSize?: "sm" | "md";
  muted?: boolean;
  /** Search term to mark inside the name and company line. */
  highlight?: string;
  /**
   * Makes the company caption a second way into the company form, so the row
   * is not driven by its edit button alone. Omit it to render plain text.
   */
  onCompanyClick?: () => void;
}) {
  const { primary, secondary } = companyLabel(group);

  const companyClass = cn(
    "mt-1 flex items-center gap-1.5 truncate",
    titleSize === "md" ? "text-[13px]" : "text-[12.5px]",
    muted ? "text-slate-500" : "text-slate-400",
  );

  const companyLine = primary ? (
    <>
      <Icon
        name="building"
        className={cn(
          "size-3.5 shrink-0",
          muted ? "text-slate-700" : "text-slate-600",
        )}
      />
      <Highlight text={primary} term={highlight} />
      {secondary ? (
        <span className="text-slate-600">
          (<Highlight text={secondary} term={highlight} />)
        </span>
      ) : (
        <span className="text-slate-600">
          {group.companyTh ? "(ไม่มีชื่อภาษาอังกฤษ)" : "(ไม่มีชื่อภาษาไทย)"}
        </span>
      )}
    </>
  ) : (
    <span className="truncate italic text-slate-600">
      {MESSAGES.noCompanyName}
    </span>
  );

  return (

    <div className="min-w-0 flex-1">
  <div className="flex flex-wrap items-center gap-2">
    {onCompanyClick ? (
      <button
        type="button"
        onClick={onCompanyClick}
        title={
          group.isCompanyMatched ? "แก้ไขชื่อบริษัท" : "เพิ่มชื่อบริษัท"
        }
        className={cn(
          "truncate font-display font-semibold text-left underline-offset-4 transition hover:text-violet-300 cursor-pointer",
          titleSize === "md" ? "text-[17px]" : "text-[15px]",
          muted ? "text-slate-300" : "text-white",
        )}
      >
        <Highlight text={group.displayName} term={highlight} />
      </button>
    ) : (
      <h3
        className={cn(
          "truncate font-display font-semibold",
          titleSize === "md" ? "text-[17px]" : "text-[15px]",
          muted ? "text-slate-300" : "text-white",
        )}
      >
        <Highlight text={group.displayName} term={highlight} />
      </h3>
    )}

    {badges}
  </div>

  <p className={companyClass}>{companyLine}</p>
</div>
  );
}

/** Wraps every case-insensitive occurrence of `term` in an accent span. */
function Highlight({ text, term }: { text: string; term?: string }) {
  const needle = term?.trim();
  if (!needle) return <>{text}</>;

  const parts: ReactNode[] = [];
  const lower = text.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  let cursor = 0;

  for (;;) {
    const at = lower.indexOf(lowerNeedle, cursor);
    if (at === -1) break;
    if (at > cursor) parts.push(text.slice(cursor, at));
    parts.push(
      <span key={at} className="text-violet-300/90">
        {text.slice(at, at + needle.length)}
      </span>,
    );
    cursor = at + needle.length;
  }
  parts.push(text.slice(cursor));

  return <>{parts}</>;
}
