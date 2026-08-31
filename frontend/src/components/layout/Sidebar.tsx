"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icon, type IconName } from "@/components/icons";
import { ConfirmModal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/auth-store";
import { useConsole } from "@/store/console-store";
import type { PanelKey } from "@/types";

interface NavItem {
  key: PanelKey;
  label: string;
  icon: IconName;
}

export const NAV_ITEMS: NavItem[] = [
  { key: "contacts", label: "ข้อมูลผู้ประสานงาน", icon: "inbox" },
  { key: "groups", label: "กลุ่มไลน์และบริษัท", icon: "building" },
  // { key: "library", label: "คลังสถานะ & Component", icon: "layers" },
];

export function Sidebar({
  active,
  onNavigate,
}: {
  active: PanelKey;
  onNavigate: (panel: PanelKey) => void;
}) {
  const { groupLines, matchedGroups, pendingCount, unmatchedGroups } =
    useConsole();
  const { username, signOut } = useAuth();
  const router = useRouter();

  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function onSignOut() {
    setSigningOut(true);
    // signOut never rejects — it drops the local session even if the API call
    // fails — so there is no failure branch to land back on this screen.
    await signOut();
    router.replace("/login");
  }

  const counts: Partial<Record<PanelKey, { value: number; tone: string }>> = {
    contacts: { value: pendingCount, tone: "bg-violet-500/15 text-violet-300" },
    groups: {
      value: unmatchedGroups.length,
      tone: "bg-amber-500/15 text-amber-300",
    },
  };

  const ratio =
    groupLines.length === 0
      ? 0
      : Math.round((matchedGroups.length / groupLines.length) * 100);

  return (
    <aside className="sticky top-0 hidden h-screen w-[266px] shrink-0 flex-col border-r border-slate-800 bg-slate-950/50 backdrop-blur-xl lg:flex">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-950/60">
          <Icon name="link" className="size-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="truncate font-display text-[15px] font-semibold tracking-tight text-white">
            NextLink AI
          </div>
          <div className="truncate text-[11px] text-slate-500">
            Coordinator Console
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        <p className="px-3 pt-2 pb-2 font-mono text-[10px] tracking-[0.16em] text-slate-600 uppercase">
          พื้นที่ทำงาน
        </p>
        {NAV_ITEMS.map((item) => {
          const on = item.key === active;
          const count = counts[item.key];
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              aria-current={on ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                on
                  ? "bg-violet-500/10 text-white shadow-[inset_0_0_0_1px_rgba(139,92,246,0.25)]"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100",
              )}
            >
              <Icon
                name={item.icon}
                className={cn(
                  "size-[18px] shrink-0",
                  on ? "text-violet-400" : "text-slate-500",
                )}
              />
              <span className="flex-1 truncate font-medium">{item.label}</span>
              {count && count.value > 0 && (
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 font-mono text-[11px] font-medium tabular-nums",
                    count.tone,
                  )}
                >
                  {count.value}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 p-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <span className="font-mono text-[10px] tracking-[0.14em] text-slate-500 uppercase">
            ความคืบหน้าการผูกบริษัท
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-semibold tabular-nums text-white">
              {ratio}
            </span>
            <span className="text-sm text-slate-500">%</span>
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400"
              style={{ width: `${ratio}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            ผูกแล้ว {matchedGroups.length} จาก {groupLines.length} กลุ่ม
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-800 font-mono text-[11px] font-medium text-slate-300 uppercase">
            {(username ?? "?").slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-slate-200">
              {username ?? "ไม่ทราบผู้ใช้"}
            </div>
            <div className="truncate text-[11px] text-slate-500">
              ผู้ดูแลระบบ
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmingSignOut(true)}
            aria-label="ออกจากระบบ"
            title="ออกจากระบบ"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300"
          >
            <Icon name="log-out" className="size-4" />
          </button>
        </div>
      </div>

      <ConfirmModal
        open={confirmingSignOut}
        icon="log-out"
        tone="danger"
        title="ออกจากระบบ"
        confirmLabel="ออกจากระบบ"
        loading={signingOut}
        onConfirm={onSignOut}
        onCancel={() => setConfirmingSignOut(false)}
      >
        ต้องการออกจากระบบใช่หรือไม่?
      </ConfirmModal>
    </aside>
  );
}
