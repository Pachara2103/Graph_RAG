"use client";

import { useMemo, useState } from "react";

import { GroupAccordion } from "@/components/groups/GroupAccordion";
import { EmptyState, GroupCardSkeleton } from "@/components/ui/EmptyState";
import { SortSelect } from "@/components/ui/Field";
import { FilterTabs } from "@/components/ui/SegmentedControl";
import { StatCard } from "@/components/ui/StatCard";
import { SORT_OPTIONS } from "@/lib/constants";
import { sortGroups } from "@/lib/filters";
import { useConsole } from "@/store/console-store";
import type { ContactStatus, SortOption } from "@/types";

/** The tabs are the approval_logs statuses, with pending first. */
type Filter = ContactStatus;

const FILTER_LABELS: Record<Filter, string> = {
  pending: "รออนุมัติ",
  approved: "อนุมัติแล้ว",
  declined: "ปฏิเสธแล้ว",
  failed: "ผิดพลาด",
};

export function ContactsPanel() {
  const {
    groupLines,
    contacts,
    matchedGroups,
    pendingCount,
    completedCount,
    statusCounts,
    syncing,
  } = useConsole();

  const [filter, setFilter] = useState<Filter>("pending");
  const [sortBy, setSortBy] = useState<SortOption>("time-desc");

  const rows = useMemo(() => {
    // Each tab shows only the rows in that state, so a coordinator moves out of
    // รออนุมัติ and into อนุมัติแล้ว the moment it is approved.
    const withContacts = groupLines.map((group) => ({
      group,
      people: (contacts[group.id] ?? []).filter((p) => p.status === filter),
    }));

    const filtered = withContacts.filter(({ group, people }) => {
      // A group with no company cannot have anything approved, and it is the
      // one thing the reviewer has to act on, so it belongs under รออนุมัติ
      // even when the LLM found nobody in it yet.
      if (filter === "pending" && !group.isCompanyMatched) return true;
      return people.length > 0;
    });

    const order = sortGroups(
      filtered.map((row) => row.group),
      sortBy,
    );
    return order.map(
      (group) => filtered.find((row) => row.group.id === group.id)!,
    );
  }, [groupLines, contacts, filter, sortBy]);

  const matchedRatio =
    groupLines.length === 0
      ? 0
      : Math.round((matchedGroups.length / groupLines.length) * 100);

  return (
    <div>
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-white">
          ข้อมูลผู้ประสานงาน
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          ตรวจและยืนยันข้อมูลที่ AI สรุปมาจากแต่ละกลุ่มไลน์ ก่อนบันทึกเข้าฐานข้อมูล
        </p>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard
          label="กลุ่มไลน์ทั้งหมด"
          value={groupLines.length}
          icon="users"
          footnote={`มีข้อมูลผู้ประสานงาน ${Object.keys(contacts).length} กลุ่ม`}
        />
        <StatCard
          label="ผูกบริษัทแล้ว"
          value={matchedGroups.length}
          icon="link"
          tone="matched"
          progress={matchedRatio}
        />
        <StatCard
          label="ยังไม่ได้ผูกบริษัท"
          value={groupLines.length - matchedGroups.length}
          icon="unlink"
          tone="unmatched"
          footnote="ต้องผูกก่อนจึงดูผู้ประสานงานได้"
        />
        <StatCard
          label="รออนุมัติ"
          value={pendingCount}
          icon="inbox"
          tone="pending"
          footnote={`อนุมัติแล้ว ${completedCount} คน`}
        />
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <FilterTabs
          value={filter}
          onChange={setFilter}
          options={(Object.keys(FILTER_LABELS) as Filter[]).map((key) => ({
            value: key,
            label: FILTER_LABELS[key],
            count: statusCounts[key],
          }))}
        />
        <div className="ml-auto flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-[0.14em] text-slate-600 uppercase">
            เรียงตาม
          </span>
          <SortSelect
            label="เรียงรายการกลุ่มไลน์"
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
          />
        </div>
      </div>

      <div className="mt-4 space-y-3.5">
        {syncing === "all" || syncing === "initial" ? (
          <>
            <GroupCardSkeleton />
            <GroupCardSkeleton />
            <GroupCardSkeleton />
          </>
        ) : rows.length === 0 ? (
          <EmptyState
            icon="inbox"
            title={`ไม่มีรายการใน "${FILTER_LABELS[filter]}"`}
            detail={
              filter === "pending"
                ? "กด อัปเดตข้อมูล ที่แถบด้านบน เพื่อให้ AI ดึงและสรุปข้อมูลจากกลุ่มไลน์"
                : "ลองสลับไปแท็บอื่นเพื่อดูรายการในสถานะนั้น"
            }
          />
        ) : (
          rows.map(({ group, people }) => (
            <GroupAccordion key={group.id} group={group} contacts={people} />
          ))
        )}
      </div>
    </div>
  );
}
