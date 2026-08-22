import { cacheLife } from "next/cache";

import { fetchArxivPaper } from "./client";
import type { ArxivPaper } from "./types";

// arXiv entries are immutable per version, so this is a safe cache boundary.
// Keyed by the arXiv id (the argument becomes part of the cache key).
export async function getArxivPaper(
  arxivId: string,
): Promise<ArxivPaper | null> {
  "use cache";
  cacheLife("days");

  return fetchArxivPaper(arxivId);
}
