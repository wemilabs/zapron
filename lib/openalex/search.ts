import { cacheLife } from "next/cache";

import { fetchSearch } from "./client";
import type { SearchParams, SearchResponse } from "./types";

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
