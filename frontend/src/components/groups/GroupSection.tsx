"use client";

import { useMemo, useState } from "react";

import { GroupRow } from "@/components/groups/GroupRow";
import { CountChip } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SortSelect } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { SORT_OPTIONS } from "@/lib/constants";
import { paginate, sortGroups } from "@/lib/filters";
import type { GroupLine, PanelKey, SortOption } from "@/types";

/**
 * A titled, sorted, paginated list of groups. Sort choice and page number are
 * local, so the matched and unmatched sections never affect one another.
 */
export function GroupSection({
  title,
  groups,
  matched,
  scope,
}: {
  title: string;
  groups: GroupLine[];
  matched: boolean;
  scope: PanelKey;
}) {
  const [sortBy, setSortBy] = useState<SortOption>("time-desc");
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => sortGroups(groups, sortBy), [groups, sortBy]);
  const view = paginate(sorted, page);

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="font-display text-lg font-semibold text-white">
            {title}
          </h2>
          <CountChip tone={matched ? "matched" : "unmatched"}>
            {groups.length}
          </CountChip>
        </div>
        <SortSelect
          label={`เรียง ${title}`}
          options={SORT_OPTIONS}
          value={sortBy}
          onChange={(event) => {
            setSortBy(event.target.value as SortOption);
            setPage(1);
          }}
        />
      </div>

      {groups.length === 0 ? (
        <div className="mt-3.5">
          {matched ? (
            <EmptyState
              icon="unlink"
              title="ยังไม่มีกลุ่มไลน์ที่ผูกบริษัท"
              detail="เริ่มจากผูกบริษัทให้กลุ่มในรายการด้านล่าง"
            />
          ) : (
            <EmptyState
              icon="check-circle"
              tone="success"
              title="ผูกบริษัทครบทุกกลุ่มไลน์แล้ว"
              detail="ไม่มีกลุ่มที่ค้างอยู่ในคิว"
            />
          )}
        </div>
      ) : (
        <>
          <div className="mt-3.5 space-y-2.5">
            {view.items.map((group) => (
              <GroupRow key={group.id} group={group} scope={scope} />
            ))}
          </div>
          <div className="mt-4">
            <Pagination
              page={view.page}
              totalPages={view.totalPages}
              onChange={setPage}
            />
          </div>
        </>
      )}
    </section>
  );
}
