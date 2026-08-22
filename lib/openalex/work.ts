import { cacheLife } from "next/cache";

import { arxivIdFromDoi } from "@/lib/arxiv/client";
import { getArxivPaper } from "@/lib/arxiv/paper";
import { reconstructAbstract } from "./abstract";
import { fetchWork, fetchWorkList } from "./client";
import { getOpenAccessUrl, normalizeWorkId } from "./format";
import type { SearchResponse, Work } from "./types";

export interface WorkDetail extends Work {
  abstractText: string | null;
  // arXiv PDF URL surfaced as a fallback when OpenAlex has no OA link.
  arxivPdfUrl: string | null;
}

// Works are immutable, so this is a safe cache boundary. Keyed by id (the
// argument becomes part of the cache key automatically).
export async function getWorkDetail(id: string): Promise<WorkDetail> {
  "use cache";
  cacheLife("days");

  const work = await fetchWork(id);
  const abstractText = reconstructAbstract(work.abstract_inverted_index);

  // Only hit arXiv when OpenAlex has no open-access link and we can bridge on
  // an arXiv id. OpenAlex rarely populates ids.arxiv_id; the reliable bridge is
  // the arXiv DOI (10.48550/arXiv.{id}). Avoids an extra request for the
  // common case where OpenAlex already has an OA URL.
  const arxivId = arxivIdFromDoi(work.doi) ?? work.ids?.arxiv_id ?? null;
  const arxivPdfUrl =
    !getOpenAccessUrl(work) && arxivId
      ? ((await getArxivPaper(arxivId))?.pdfUrl ?? null)
      : null;

  return {
    ...work,
    abstractText,
    arxivPdfUrl,
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
