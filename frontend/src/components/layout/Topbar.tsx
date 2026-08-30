"use client";

import { useState } from "react";

import { NAV_ITEMS } from "@/components/layout/Sidebar";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";
import { cn, formatThaiDate } from "@/lib/utils";
import { useConsole } from "@/store/console-store";
import type { PanelKey } from "@/types";

const SHORT_LABELS: Record<PanelKey, string> = {
  contacts: "ผู้ประสานงาน",
  groups: "กลุ่มไลน์",
  library: "สถานะ",
};

export function Topbar({
  active,
  onNavigate,
}: {
  active: PanelKey;
  onNavigate: (panel: PanelKey) => void;
}) {
  const { lastSyncedAt, syncing, sync } = useConsole();
  const [confirmingUpdate, setConfirmingUpdate] = useState(false);

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-4 px-5 py-4 sm:px-8">
        <div className="flex gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1 lg:hidden">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[13px] transition",
                item.key === active
                  ? "bg-violet-500/15 text-violet-200"
                  : "text-slate-400 hover:text-slate-100",
              )}
            >
              {SHORT_LABELS[item.key]}
            </button>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Icon name="clock" className="size-4 text-slate-600" />
          <span className="text-[13px] text-slate-500">ซิงค์ล่าสุด</span>
          <span className="font-mono text-[13px] tabular-nums text-slate-300">
            {formatThaiDate(lastSyncedAt, true)}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <Button
            icon="refresh"
            size="sm"
            loading={syncing === "groups"}
            disabled={syncing !== null}
            onClick={() => sync("groups")}
          >
            <span className="hidden sm:inline">รีเฟรชกลุ่มไลน์</span>
          </Button>
          <Button
            variant="primary"
            icon="sparkles"
            loading={syncing === "all"}
            disabled={syncing !== null}
            onClick={() => setConfirmingUpdate(true)}
          >
            {syncing === "all" ? "กำลังวิเคราะห์ข้อมูล..." : "อัปเดตข้อมูล"}
          </Button>
        </div>
      </div>

      <ConfirmModal
        open={confirmingUpdate}
        icon="sparkles"
        tone="warn"
        title="ยืนยันการอัปเดตข้อมูล"
        confirmLabel="อัปเดตข้อมูล"
        onConfirm={() => {
          setConfirmingUpdate(false);
          // Deliberately not awaited: the button shows its own loading state
          // and any failure surfaces as a toast.
          void sync("all");
        }}
        onCancel={() => setConfirmingUpdate(false)}
      >
        การอัปเดตข้อมูลจะให้ AI อ่านและสรุปแชทของทุกกลุ่มไลน์ที่มีข้อความใหม่
        ซึ่ง<strong className="font-semibold text-amber-200">มีค่าใช้จ่ายตามจำนวนข้อความ</strong>{" "}
        กรุณากดเมื่อจำเป็นเท่านั้น
      </ConfirmModal>
    </header>
  );
}
