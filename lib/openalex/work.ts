import { cacheLife } from "next/cache";

import { reconstructAbstract } from "./abstract";
import { fetchWork, fetchWorkList } from "./client";
import { normalizeWorkId } from "./format";
import type { SearchResponse, Work } from "./types";

export interface WorkDetail extends Work {
  abstractText: string | null;
}

// Works are immutable, so this is a safe cache boundary. Keyed by id (the
// argument becomes part of the cache key automatically).
export async function getWorkDetail(id: string): Promise<WorkDetail> {
  "use cache";
  cacheLife("days");

  const work = await fetchWork(id);
  return {
    ...work,
    abstractText: reconstructAbstract(work.abstract_inverted_index),
  };
}

export async function getReferencedWorks(
  ids: string[],
): Promise<SearchResponse> {
  "use cache";
  cacheLife("days");

  const workIds = ids.slice(0, 25).map(normalizeWorkId);
  if (workIds.length === 0) {
    return {
      meta: { count: 0, per_page: 0, page: null, next_cursor: null },
      results: [],
    };
  }

  return fetchWorkList({
    filter: `openalex_id:${workIds.join("|")}`,
    per_page: workIds.length,
  });
}

export async function getCitingWorks(id: string): Promise<SearchResponse> {
  "use cache";
  cacheLife("hours");

  return fetchWorkList({
    filter: `cites:${normalizeWorkId(id)}`,
    sort: "cited_by_count:desc",
    per_page: 10,
  });
}
