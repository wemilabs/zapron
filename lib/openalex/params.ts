import type { SearchParams, SortField } from "./types";

// Parse Next.js searchParams (a record of string | string[] | undefined) into
// a typed SearchParams object suitable for searchWorks.
const VALID_WORK_TYPES = new Set([
  "article",
  "preprint",
  "review",
  "book",
  "book-chapter",
  "dissertation",
  "report",
  "dataset",
  "proceedings-article",
]);

export function parseSearchParams(
  sp: Record<string, string | string[] | undefined>,
): SearchParams {
  const get = (key: string): string | undefined => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const getAll = (key: string): string[] => {
    const value = sp[key];
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  };

  const num = (key: string): number | undefined => {
    const v = get(key);
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const sort = get("sort") as SortField | undefined;
  const validSorts: SortField[] = [
    "relevance_score",
    "publication_date",
    "cited_by_count",
  ];

  return {
    query: get("q") ?? "",
    yearMin: num("year_min"),
    yearMax: num("year_max"),
    types: getAll("type").filter((type) => VALID_WORK_TYPES.has(type)),
    openAccessOnly: get("oa_only") === "true",
    sort: sort && validSorts.includes(sort) ? sort : "relevance_score",
    sortDirection: get("sort_dir") === "asc" ? "asc" : "desc",
    perPage: num("per_page") ?? 25,
    cursor: get("cursor") || undefined,
    page: num("page"),
  };
}
