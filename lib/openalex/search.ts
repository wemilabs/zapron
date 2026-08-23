import { cacheLife } from "next/cache";

import { resolveAuthor } from "./authors";
import { fetchSearch } from "./client";
import type {
  OpenAlexAuthor,
  SearchParams,
  SearchResponse,
  WorkSearchResult,
} from "./types";

function buildFilter(params: SearchParams): string {
  const parts: string[] = [];

  if (params.yearMin !== undefined && params.yearMax !== undefined) {
    parts.push(`publication_year:${params.yearMin}-${params.yearMax}`);
  } else if (params.yearMin !== undefined) {
    parts.push(`publication_year:>${params.yearMin - 1}`);
  } else if (params.yearMax !== undefined) {
    parts.push(`publication_year:<${params.yearMax + 1}`);
  }

  if (params.types?.length) {
    parts.push(`type:${params.types.join("|")}`);
  }

  if (params.openAccessOnly) {
    parts.push("open_access.is_oa:true");
  }

  if (params.continents?.length) {
    parts.push(`institutions.continent:${params.continents.join("|")}`);
  }

  if (params.countries?.length) {
    parts.push(`institutions.country_code:${params.countries.join("|")}`);
  }

  return parts.join(",");
}

function buildSort(params: SearchParams): string {
  const field = params.sort ?? "relevance_score";
  const direction = params.sortDirection ?? "desc";
  return `${field}:${direction}`;
}

export async function searchWorks(
  params: SearchParams,
): Promise<SearchResponse> {
  "use cache";
  cacheLife("minutes");

  const query = params.query.trim();
  if (!query) {
    return {
      meta: { count: 0, per_page: 0, page: null, next_cursor: null },
      results: [],
    };
  }

  const requestParams: Record<string, string | number | boolean | undefined> = {
    search: query,
    filter: buildFilter(params) || undefined,
    sort: buildSort(params),
    per_page: params.perPage ?? 25,
  };

  if (params.cursor) {
    requestParams.cursor = params.cursor;
  } else if (params.page) {
    requestParams.page = params.page;
  }

  return fetchSearch(requestParams);
}

const EMPTY_RESPONSE: SearchResponse = {
  meta: { count: 0, per_page: 0, page: null, next_cursor: null },
  results: [],
};

async function searchWorksByAuthor(
  params: SearchParams,
  author: OpenAlexAuthor,
): Promise<SearchResponse> {
  "use cache";
  cacheLife("minutes");

  const authorId = author.id.split("/").pop() ?? author.id;
  const filterParts = [`author.id:${authorId}`];
  const otherFilters = buildFilter(params);
  if (otherFilters) filterParts.push(otherFilters);

  // Without a text query, relevance_score is meaningless — rank by citations.
  const sort =
    params.sort && params.sort !== "relevance_score"
      ? buildSort(params)
      : "cited_by_count:desc";

  const requestParams: Record<string, string | number | boolean | undefined> = {
    filter: filterParts.join(","),
    sort,
    per_page: params.perPage ?? 25,
  };

  if (params.cursor) {
    requestParams.cursor = params.cursor;
  } else if (params.page) {
    requestParams.page = params.page;
  }

  return fetchSearch(requestParams);
}

// Entity-aware search: route clear author-name queries to that author's works
// (Scholar-style), everything else to relevance-ranked text search.
export async function search(params: SearchParams): Promise<WorkSearchResult> {
  const query = params.query.trim();
  if (!query) return { author: null, works: EMPTY_RESPONSE };

  const author = await resolveAuthor(query);
  if (author) {
    return { author, works: await searchWorksByAuthor(params, author) };
  }

  return { author: null, works: await searchWorks(params) };
}
