"use client";

import { ContactCard } from "@/components/contacts/ContactCard";
import { CompanyForm } from "@/components/groups/CompanyForm";
import { GroupChip, GroupIdentity } from "@/components/groups/GroupIdentity";
import { Icon } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { cn, formatThaiDate } from "@/lib/utils";
import { useConsole } from "@/store/console-store";
import type { Coordinator, GroupLine } from "@/types";

/**
 * One group as an expandable card. Unmatched groups cannot be expanded, because
 * the graph write matches on the company node. The original simply omitted the
 * button; here the control is disabled and the reason is spelled out.
 */
export function GroupAccordion({
  group,
  contacts,
}: {
  group: GroupLine;
  contacts: Coordinator[];
}) {
  const {
    viewingGroupId,
    toggleView,
    openCompanyForm,
    isCompanyFormOpen,
  } = useConsole();

  const expanded = viewingGroupId === group.id;
  const formOpen = isCompanyFormOpen("contacts", group.id);
  const matched = group.isCompanyMatched;
  const pending = contacts.filter((p) => p.status === "pending").length;
  const allDone = contacts.length > 0 && pending === 0;

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border transition",
        formOpen && "border-violet-500/40 bg-violet-500/[0.04]",
        !formOpen && matched && !allDone && "border-slate-700/60 bg-slate-800/30",
        !formOpen && matched && allDone && "border-slate-800 bg-slate-800/20",
        !formOpen && !matched && "border-amber-500/25 bg-amber-500/[0.04]",
      )}
    >
      {formOpen ? (
        <CompanyForm group={group} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
            <GroupChip matched={matched} dim={allDone} />

            <GroupIdentity
              group={group}
              muted={allDone}
              onCompanyClick={() => openCompanyForm("contacts", group.id)}
              badges={
                <>
                  <Badge tone={matched ? "matched" : "unmatched"} dot>
                    {matched ? "ผูกบริษัทแล้ว" : "ยังไม่ได้ผูกบริษัท"}
                  </Badge>
                  {pending > 0 && matched && (
                    <Badge tone="pending">{pending} รออนุมัติ</Badge>
                  )}
                  {pending > 0 && !matched && (
                    <Badge tone="neutral">{pending} รออนุมัติ</Badge>
                  )}
                  {allDone && (
                    <Badge tone="neutral">
                      อนุมัติแล้ว {contacts.length} คน
                    </Badge>
                  )}
                </>
              }
            />

            <div className="flex items-center gap-2">
              <span className="hidden font-mono text-[11px] tabular-nums text-slate-600 sm:inline">
                {formatThaiDate(group.updatedAt)}
              </span>

              {matched ? (
                <Button
                  icon="pencil"
                  size="sm"
                  onClick={() => openCompanyForm("contacts", group.id)}
                >
                  แก้ไขบริษัท
                </Button>
              ) : (
                <Button
                  variant="warn"
                  icon="plus"
                  onClick={() => openCompanyForm("contacts", group.id)}
                >
                  เพิ่มบริษัท
                </Button>
              )}

              <IconButton
                icon={expanded ? "chevrons-up" : "chevrons-down"}
                label={
                  matched
                    ? expanded
                      ? "ซ่อนข้อมูลผู้ประสานงาน"
                      : "ดูข้อมูลผู้ประสานงาน"
                    : "ต้องผูกบริษัทก่อนจึงดูข้อมูลผู้ประสานงานได้"
                }
                disabled={!matched}
                aria-expanded={matched ? expanded : undefined}
                onClick={() => toggleView(group.id)}
              />
            </div>
          </div>

          {!matched && pending > 0 && (
            <div className="flex items-start gap-2.5 border-t border-amber-500/15 bg-amber-500/[0.04] px-4 py-3 sm:px-5">
              <Icon
                name="info"
                className="mt-0.5 size-4 shrink-0 text-amber-400/70"
              />
              <p className="text-[12.5px] leading-relaxed text-amber-200/70">
                มีข้อมูลผู้ประสานงาน {pending} รายการรออนุมัติอยู่ จำเป็นต้องผูกกลุ่มนี้กับบริษัทก่อน จึงจะเปิดดูและอนุมัติได้
              </p>
            </div>
          )}

          {expanded && (
            <div className="border-t border-slate-700/60 bg-slate-900/40 p-4 sm:p-5">
              {/* <div className="mb-3.5 flex items-center gap-2">
                <Icon name="users" className="size-4 text-slate-500" />
                <span className="font-mono text-[10px] tracking-[0.14em] text-slate-500 uppercase">
                  ผู้ประสานงานในกลุ่มนี้ · {contacts.length} คน
                </span>
              </div> */}

              {contacts.length === 0 ? (
                <p className="py-4 text-center text-[13px] text-slate-500">
                  ยังไม่มีผู้ประสานงานที่ AI สรุปได้จากกลุ่มนี้
                </p>
              ) : (
                <div className="space-y-3">
                  {contacts.map((person) => (
                    <ContactCard
                      key={person.id}
                      groupId={group.id}
                      person={person}
                      groupMatched={matched}
                    />
                  ))}
                </div>
              )}

              <Button
                icon="chevrons-up"
                fullWidth
                onClick={() => toggleView(group.id)}
                className="mt-4 border-slate-700/60 bg-slate-800/40 text-slate-400 hover:text-slate-200"
              >
                ซ่อนข้อมูล
              </Button>
            </div>
          )}
        </>
      )}
    </article>
  );
}
