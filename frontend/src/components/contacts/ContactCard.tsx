"use client";

import { useState } from "react";

import { ContactForm } from "@/components/contacts/ContactForm";
import { Icon, type IconName } from "@/components/icons";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";
import { FIELD_LABELS } from "@/lib/constants";
import {
  cn,
  coordinatorName,
  formatThaiDate,
  isBlank,
  missingFieldCount,
} from "@/lib/utils";
import { useConsole } from "@/store/console-store";
import type { ContactStatus, Coordinator, CoordinatorField } from "@/types";

/** The four fields shown in the summary grid, with the icon each one carries. */
const DETAIL_FIELDS: { field: CoordinatorField; icon: IconName; mono?: boolean }[] =
  [
    { field: "nickname", icon: "user" },
    { field: "jobTitle", icon: "briefcase" },
    { field: "phone", icon: "phone", mono: true },
    { field: "email", icon: "mail", mono: true },
  ];

export function ContactCard({
  groupId,
  person,
  /** Drives the label of the confirm button, as in the original. */
  groupMatched,
}: {
  groupId: string;
  person: Coordinator;
  groupMatched: boolean;
}) {
  const { editingContactId, startContactEdit, confirmContact, declineContact } =
    useConsole();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  // The approval is a graph write, so the button has to say it is working and
  // stop taking clicks — the same contract CompanyForm's ยืนยัน button keeps.
  async function onConfirm() {
    if (saving) return;
    setSaving(true);
    try {
      await confirmContact(groupId, person.id);
    } finally {
      // On success the card re-renders as approved and this never shows again;
      // on failure confirmContact has raised its toast and the button must
      // come back so the reviewer can try again.
      setSaving(false);
    }
  }

  async function onDelete() {
    setDeleting(true);
    await declineContact(groupId, person.id);
    // declineContact swallows its own errors into a toast, so the dialog just
    // closes either way — a failed row keeps its pending state on screen.
    setDeleting(false);
    setConfirmingDelete(false);
  }

  // Only a pending row still needs the reviewer. Everything else is history.
  if (person.status !== "pending") {
    return <ResolvedContact person={person} />;
  }

  if (editingContactId === person.id) {
    return (
      <div className="rounded-xl border border-violet-500/40 bg-slate-800/40">
        <ContactForm groupId={groupId} person={person} />
      </div>
    );
  }

  const { primary, secondary } = coordinatorName(person);
  const missing = missingFieldCount(person);

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4">
      <div className="flex flex-wrap items-start gap-3.5">
        {/* <div className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500/25 to-indigo-500/15 font-mono text-[12px] font-medium text-violet-200">
          {initials(person)}
        </div> */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-display text-[15px] font-semibold text-white">
              {primary}
            </h4>
            {secondary && (
              <span className="text-[13px] text-slate-500">{secondary}</span>
            )}
            <Badge tone="pending" className="uppercase">
              รออนุมัติ
            </Badge>
            {missing > 0 && (
              <Badge tone="unmatched">ข้อมูลไม่ครบ {missing} ช่อง</Badge>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <Icon name="tag" className="size-3.5" />
              {isBlank(person.relevant) ? (
                <span className="text-slate-600 italic">ยังไม่ระบุกิจกรรม</span>
              ) : (
                <span className="rounded-md border border-slate-600/60 bg-slate-700/40 px-1.5 py-px text-[11px] text-slate-300">
                  {person.relevant}
                </span>
              )}
            </span>
            {/* When this row last changed — the reviewer needs it to tell a
                fresh extraction from one that has been sitting in the queue. */}
            <span className="flex items-center gap-1.5 tabular-nums">
              <Icon name="clock" className="size-3.5" />
              เข้ามาเมื่อ {formatThaiDate(person.updatedAt, true)}
            </span>
          </div>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3.5 border-t border-slate-700/40 pt-4 sm:grid-cols-2 lg:grid-cols-4">
        {DETAIL_FIELDS.map(({ field, icon, mono }) => {
          const blank = isBlank(person[field]);
          return (
            <div key={field} className="flex items-start gap-2.5">
              <Icon
                name={icon}
                className={`mt-0.25 size-7 shrink-0 ${blank ? "text-slate-700" : "text-slate-600"}`}
              />
              <div className="min-w-0">
                <dt className="font-mono text-[10px] tracking-[0.12em] text-slate-500 uppercase">
                  {FIELD_LABELS[field]}
                </dt>
                {blank ? (
                  <dd className="truncate text-[13px] text-slate-600 italic">
                    ไม่มีข้อมูล
                  </dd>
                ) : (
                  <dd
                    className={`truncate text-slate-200 ${mono ? "font-mono text-[13px] tabular-nums" : "text-[13.5px]"}`}
                  >
                    {person[field]}
                  </dd>
                )}
              </div>
            </div>
          );
        })}
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <Button
          variant="primary"
          icon="check"
          loading={saving}
          onClick={onConfirm}
          className="flex-1 sm:max-w-[180px]"
        >
          {saving
            ? "กำลังบันทึก..."
            : groupMatched
              ? "ยืนยันและบันทึก"
              : "เพิ่ม"}
        </Button>
        <Button
          icon="pencil"
          disabled={saving}
          onClick={() => startContactEdit(person.id)}
          className="flex-1 sm:max-w-[140px]"
        >
          แก้ไข
        </Button>
        {/* Destructive, so it sits apart from the two it must not be mistaken for. */}
        <Button
          variant="danger"
          icon="trash"
          disabled={saving}
          onClick={() => setConfirmingDelete(true)}
          className="ml-auto"
        >
          ลบข้อมูล
        </Button>
      </div>

      <ConfirmModal
        open={confirmingDelete}
        icon="trash"
        tone="danger"
        title="ลบข้อมูลผู้ประสานงาน"
        confirmLabel="ลบข้อมูล"
        loading={deleting}
        onConfirm={onDelete}
        onCancel={() => setConfirmingDelete(false)}
      >
        ต้องการลบ <strong className="font-semibold text-slate-200">{primary}</strong>{" "}
        ออกจากรายการรออนุมัติใช่หรือไม่? รายการจะถูกย้ายไปที่แท็บ ปฏิเสธแล้ว
        และจะไม่ถูกบันทึกเข้าฐานข้อมูล
      </ConfirmModal>
    </div>
  );
}

/** How each non-pending approval_logs status reads on the card. */
const RESOLVED: Record<
  Exclude<ContactStatus, "pending">,
  { box: string; chip: string; icon: IconName; iconColor: string; badge: BadgeTone; label: string; caption: string; captionColor: string }
> = {
  approved: {
    box: "border-emerald-500/25 bg-emerald-500/[0.07]",
    chip: "border-emerald-500/30 bg-emerald-500/15",
    icon: "check",
    iconColor: "text-emerald-400",
    badge: "completed",
    label: "อนุมัติแล้ว",
    caption: "บันทึกเข้าฐานข้อมูลเมื่อ",
    captionColor: "text-emerald-300/60",
  },
  declined: {
    box: "border-slate-700/60 bg-slate-800/30",
    chip: "border-slate-600/50 bg-slate-700/40",
    icon: "x",
    iconColor: "text-slate-400",
    badge: "neutral",
    label: "ปฏิเสธแล้ว",
    caption: "ปฏิเสธเมื่อ",
    captionColor: "text-slate-500",
  },
  failed: {
    box: "border-rose-500/30 bg-rose-500/[0.07]",
    chip: "border-rose-500/30 bg-rose-500/15",
    icon: "alert",
    iconColor: "text-rose-400",
    badge: "unmatched",
    label: "บันทึกไม่สำเร็จ",
    caption: "ล้มเหลวเมื่อ",
    captionColor: "text-rose-300/70",
  },
};

function ResolvedContact({ person }: { person: Coordinator }) {
  const { primary, secondary } = coordinatorName(person);
  const spec = RESOLVED[person.status as Exclude<ContactStatus, "pending">];

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3.5 rounded-xl border p-4",
        spec.box,
      )}
    >
      <div
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full border",
          spec.chip,
        )}
      >
        <Icon name={spec.icon} className={cn("size-4", spec.iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="truncate font-display text-[15px] font-semibold text-white">
            {primary}
          </h4>
          {secondary && (
            <span className="text-[13px] text-slate-500">{secondary}</span>
          )}
          <Badge tone={spec.badge} className="uppercase">
            {spec.label}
          </Badge>
        </div>
        <p className={cn("mt-0.5 text-[12px]", spec.captionColor)}>
          {spec.caption} {formatThaiDate(person.updatedAt, true)}
        </p>
      </div>
    </div>
  );
}
