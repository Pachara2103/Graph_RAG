"use client";

import { CompanyForm } from "@/components/groups/CompanyForm";
import { GroupChip, GroupIdentity } from "@/components/groups/GroupIdentity";
import { Button } from "@/components/ui/Button";
import { cn, formatThaiDate } from "@/lib/utils";
import { useConsole } from "@/store/console-store";
import type { GroupLine, PanelKey } from "@/types";

/**
 * Compact directory row. Same identity block as the accordion card, but no
 * expansion: this list is about the company link, not the coordinators.
 */
export function GroupRow({
  group,
  scope,
  highlight,
}: {
  group: GroupLine;
  scope: PanelKey;
  /** Search term, marked inside the name and company line. */
  highlight?: string;
}) {
  const { openCompanyForm, isCompanyFormOpen } = useConsole();
  const formOpen = isCompanyFormOpen(scope, group.id);
  const matched = group.isCompanyMatched;

  if (formOpen) {
    return (
      <div className="rounded-xl border border-violet-500/40 bg-violet-500/[0.05]">
        <CompanyForm group={group} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 rounded-xl border p-4 transition",
        matched
          ? "border-slate-700/60 bg-slate-800/30 hover:border-slate-600/70 hover:bg-slate-800/50"
          : "border-amber-500/25 bg-amber-500/[0.04] hover:bg-amber-500/[0.07]",
      )}
    >
      <GroupChip matched={matched} size="sm" />
      <GroupIdentity
        group={group}
        titleSize="sm"
        highlight={highlight}
        onCompanyClick={() => openCompanyForm(scope, group.id)}
      />

      <span className="hidden font-mono text-[11px] tabular-nums text-slate-600 sm:inline">
        {formatThaiDate(group.updatedAt, true)}
      </span>

      {matched ? (
        <Button
          icon="pencil"
          size="sm"
          onClick={() => openCompanyForm(scope, group.id)}
        >
          แก้ไข
        </Button>
      ) : (
        <Button
          variant="warn"
          icon="plus"
          size="sm"
          onClick={() => openCompanyForm(scope, group.id)}
        >
          เพิ่มบริษัท
        </Button>
      )}
    </div>
  );
}
