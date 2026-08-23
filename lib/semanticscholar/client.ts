import type {
  S2CitationsResponse,
  S2Paper,
  S2RecommendationsResponse,
  S2ReferencesResponse,
} from "./types";

export class SemanticScholarError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "SemanticScholarError";
  }
}

interface FetchOptions {
  path: string;
  params?: Record<string, string | number | boolean | undefined>;
}

// The S2 key is optional. Without it the Graph API allows 1 req/sec; with it
// ~100 req/sec. We attach the header only when present so the unauthenticated
// path still works for local development.
function apiKey(): string | null {
  return process.env.SEMANTIC_SCHOLAR_API_KEY || null;
}

async function s2Fetch<T>({ path, params }: FetchOptions): Promise<T> {
  const baseUrl =
    process.env.SEMANTIC_SCHOLAR_API_BASE_URL ||
    "https://api.semanticscholar.org";
  const url = new URL(`${baseUrl}${path}`);
  const searchParams = url.searchParams;

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  const key = apiKey();
  if (key) headers["x-api-key"] = key;

  const res = await fetch(url.toString(), { headers });

  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      // ignore
    }
    throw new SemanticScholarError(
      `Semantic Scholar request failed (${res.status}): ${detail.slice(0, 200)}`,
      res.status,
    );
  }

  return res.json() as Promise<T>;
}

// Fields selected for the focus paper lookup. Includes tldr, which is only
// supported on the /paper/{id} and recommendations endpoints.
const PAPER_SELECT = [
  "paperId",
  "title",
  "abstract",
  "year",
  "venue",
  "authors",
  "citationCount",
  "influentialCitationCount",
  "referenceCount",
  "isOpenAccess",
  "openAccessPdf",
  "fieldsOfStudy",
  "tldr",
  "externalIds",
  "url",
].join(",");

// Fields for references/citations sub-endpoints. These endpoints do not
// support tldr, so we omit it. The graph nodes don't need it anyway; only the
// focus paper and recommendations show TLDRs.
const NEIGHBOR_SELECT = [
  "paperId",
  "title",
  "abstract",
  "year",
  "venue",
  "authors",
  "citationCount",
  "influentialCitationCount",
  "referenceCount",
  "isOpenAccess",
  "openAccessPdf",
  "fieldsOfStudy",
  "externalIds",
  "url",
].join(",");

export async function fetchS2Paper(paperId: string): Promise<S2Paper> {
  return s2Fetch<S2Paper>({
    path: `/graph/v1/paper/${encodeURIComponent(paperId)}`,
    params: { fields: PAPER_SELECT },
  });
}

export async function fetchS2References(
  paperId: string,
  limit: number,
): Promise<S2ReferencesResponse> {
  return s2Fetch<S2ReferencesResponse>({
    path: `/graph/v1/paper/${encodeURIComponent(paperId)}/references`,
    params: { fields: NEIGHBOR_SELECT, limit },
  });
}

export async function fetchS2Citations(
  paperId: string,
  limit: number,
): Promise<S2CitationsResponse> {
  return s2Fetch<S2CitationsResponse>({
    path: `/graph/v1/paper/${encodeURIComponent(paperId)}/citations`,
    params: { fields: NEIGHBOR_SELECT, limit },
  });
}

export async function fetchS2Recommendations(
  paperId: string,
  limit: number,
): Promise<S2RecommendationsResponse> {
  return s2Fetch<S2RecommendationsResponse>({
    path: `/recommendations/v1/papers/forpaper/${encodeURIComponent(paperId)}`,
    params: { fields: NEIGHBOR_SELECT, limit },
  });
}
