import { ITEMS_PER_PAGE } from "@/lib/constants";
import type { GroupLine, SortOption } from "@/types";

/**
 * Case-insensitive substring match across the three searchable fields.
 * A blank term matches nothing on purpose: the results block stays hidden
 * instead of listing every group.
 */
export function searchGroups(groups: GroupLine[], term: string): GroupLine[] {
  const needle = term.trim().toLowerCase();
  if (!needle) return [];
  return groups.filter((g) =>
    [g.displayName, g.companyTh, g.companyEn].some((field) =>
      (field ?? "").toLowerCase().includes(needle),
    ),
  );
}

function time(iso: string | null, fallback: number): number {
  if (!iso) return fallback;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? fallback : t;
}

/**
 * Null handling mirrors the Python sort_groups: name sorts treat null as an
 * empty string (blanks first), while rows without updatedAt land last in both
 * time directions.
 */
export function sortGroups(
  groups: GroupLine[],
  sortBy: SortOption,
): GroupLine[] {
  const byText =
    (pick: (g: GroupLine) => string | null) => (a: GroupLine, b: GroupLine) =>
      (pick(a) ?? "")
        .toLowerCase()
        .localeCompare((pick(b) ?? "").toLowerCase(), "th");

  const sorted = [...groups];
  switch (sortBy) {
    case "group-name":
      return sorted.sort(byText((g) => g.displayName));
    case "company-th":
      return sorted.sort(byText((g) => g.companyTh));
    case "company-en":
      return sorted.sort(byText((g) => g.companyEn));
    case "time-desc":
      return sorted.sort(
        (a, b) =>
          time(b.updatedAt, Number.NEGATIVE_INFINITY) -
          time(a.updatedAt, Number.NEGATIVE_INFINITY),
      );
    case "time-asc":
      return sorted.sort(
        (a, b) =>
          time(a.updatedAt, Number.POSITIVE_INFINITY) -
          time(b.updatedAt, Number.POSITIVE_INFINITY),
      );
    default:
      return sorted;
  }
}

export function paginate<T>(
  items: T[],
  page: number,
  perPage: number = ITEMS_PER_PAGE,
): { page: number; totalPages: number; items: T[] } {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * perPage;
  return {
    page: current,
    totalPages,
    items: items.slice(start, start + perPage),
  };
}
