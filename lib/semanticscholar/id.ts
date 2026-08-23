import { arxivIdFromDoi } from "@/lib/arxiv/client";
import type { S2Paper } from "./types";

// Bridge an OpenAlex work to a Semantic Scholar paper id. S2 accepts DOI:,
// ARXIV:, PMID:, etc. prefixes. We prefer DOI (most reliable), then fall back
// to the arXiv id derived from the arXiv DOI (10.48550/arXiv.{id}) or stored
// directly on the OpenAlex work. Returns null when no bridge is available so
// callers can render an empty state instead of throwing.
export function toS2PaperId(work: {
  doi: string | null;
  ids?: { arxiv_id?: string | null } | null;
}): string | null {
  if (work.doi) {
    const doi = work.doi.replace(/^https?:\/\/doi\.org\//i, "");
    return `DOI:${doi}`;
  }

  const arxivId = work.ids?.arxiv_id ?? arxivIdFromDoi(work.doi);
  if (arxivId) return `ARXIV:${arxivId}`;

  return null;
}

// Build a Zapron route href for an S2 paper, preferring the DOI bridge into
// OpenAlex (so neighbors stay inside the app) and falling back to the S2 page
// URL when no DOI is available. The DOI is encoded as `doi:<doi>` so
// normalizeWorkId passes it through to OpenAlex's /works/doi:{doi} endpoint.
export function toOpenAlexHref(paper: S2Paper): string | null {
  const doi = paper.externalIds?.DOI;
  if (doi) {
    return `/work/${encodeURIComponent(`doi:${doi}`)}`;
  }
  return paper.url ?? null;
}
