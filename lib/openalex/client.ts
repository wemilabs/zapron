import type { SearchResponse, Work } from "./types";

function getApiKey(): string {
  const key = process.env.OPENALEX_API_KEY;
  if (!key) {
    throw new Error(
      "OPENALEX_API_KEY is not set. Create a free key at https://openalex.org/settings/api and add it to .env.local.",
    );
  }
  return key;
}

export class OpenAlexError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "OpenAlexError";
  }
}

interface FetchOptions {
  path: string;
  params?: Record<string, string | number | boolean | undefined>;
  requireKey?: boolean;
}

async function openalexFetch<T>({
  path,
  params,
  requireKey = true,
}: FetchOptions): Promise<T> {
  const baseUrl =
    process.env.OPENALEX_API_BASE_URL || "https://api.openalex.org";
  const url = new URL(`${baseUrl}${path}`);
  const searchParams = url.searchParams;

  if (requireKey) {
    searchParams.set("api_key", getApiKey());
  }

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    }
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      // ignore
    }
    throw new OpenAlexError(
      `OpenAlex request failed (${res.status}): ${detail.slice(0, 200)}`,
      res.status,
    );
  }

  return res.json() as Promise<T>;
}

// Fields selected for search results — enough to render a result card.
const SEARCH_SELECT = [
  "id",
  "doi",
  "display_name",
  "title",
  "publication_year",
  "publication_date",
  "type",
  "cited_by_count",
  "is_retracted",
  "open_access",
  "authorships",
  "primary_location",
  "best_oa_location",
  "abstract_inverted_index",
].join(",");

// Fields selected for a single work detail page.
const DETAIL_SELECT = [
  "id",
  "doi",
  "display_name",
  "title",
  "publication_year",
  "publication_date",
  "type",
  "cited_by_count",
  "is_retracted",
  "open_access",
  "authorships",
  "primary_location",
  "best_oa_location",
  "locations",
  "biblio",
  "concepts",
  "ids",
  "abstract_inverted_index",
  "referenced_works",
  "related_works",
].join(",");

export async function fetchSearch(
  params: Record<string, string | number | boolean | undefined>,
): Promise<SearchResponse> {
  return fetchWorkList(params);
}

export async function fetchWork(id: string): Promise<Work> {
  return openalexFetch<Work>({
    path: `/works/${id}`,
    params: { select: DETAIL_SELECT },
  });
}

export async function fetchWorkList(
  params: Record<string, string | number | boolean | undefined>,
): Promise<SearchResponse> {
  return openalexFetch<SearchResponse>({
    path: "/works",
    params: { ...params, select: SEARCH_SELECT },
  });
}
