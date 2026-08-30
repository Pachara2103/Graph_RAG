"use client";

import { useMemo, useState } from "react";

import { GroupRow } from "@/components/groups/GroupRow";
import { GroupSection } from "@/components/groups/GroupSection";
import { EmptyState, GroupCardSkeleton } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/Field";
import { searchGroups } from "@/lib/filters";
import { useConsole } from "@/store/console-store";

export function GroupsPanel() {
  const {
    groupLines,
    matchedGroups,
    unmatchedGroups,
    syncing,
  } = useConsole();

  const [term, setTerm] = useState("");
  const results = useMemo(() => searchGroups(groupLines, term), [groupLines, term]);
  const searching = term.trim() !== "";

  return (
    <div>
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-white">
          กลุ่มไลน์และบริษัท
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          จัดการความสัมพันธ์ระหว่างกลุ่มไลน์กับบริษัท
        </p>
      </header>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-800/30 p-4 sm:p-5">
        <SearchInput
          value={term}
          onValueChange={setTerm}
          onClear={() => setTerm("")}
          placeholder="ค้นหาด้วยชื่อกลุ่มไลน์ หรือชื่อบริษัท (TH / EN)..."
        />

        {searching && (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <p className="text-[12.5px] text-slate-400">
                พบ{" "}
                <span className="font-mono font-medium tabular-nums text-violet-300">
                  {results.length}
                </span>{" "}
                รายการจากคำค้น{" "}
                <span className="text-slate-200">“{term.trim()}”</span>
              </p>
              <p className="font-mono text-[11px] text-slate-600">
                ค้นในฟิลด์: display_name · company_th · company_en
              </p>
            </div>

            <div className="mt-3.5">
              {results.length === 0 ? (
                <EmptyState
                  icon="search"
                  title="ไม่พบรายการที่ค้นหา"
                  detail="ลองใช้คำสั้นลง หรือค้นด้วยชื่อบริษัทภาษาอังกฤษแทน"
                />
              ) : (
                <div className="space-y-2.5">
                  {results.map((group) => (
                    <GroupRow
                      key={group.id}
                      group={group}
                      scope="groups"
                      highlight={term}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {syncing ? (
        <div className="mt-8 space-y-2.5">
          <GroupCardSkeleton />
          <GroupCardSkeleton />
          <GroupCardSkeleton />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <GroupSection
            title="กลุ่มไลน์ที่ผูกบริษัทแล้ว"
            groups={matchedGroups}
            matched
            scope="groups"
          />
          <GroupSection
            title="กลุ่มไลน์ที่ยังไม่ได้ผูกบริษัท"
            groups={unmatchedGroups}
            matched={false}
            scope="groups"
          />
        </div>
      )}
    </div>
  );
}
