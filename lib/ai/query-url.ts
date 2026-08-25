import type { ParsedSearchQuery } from "@/lib/ai/types";

// Maps an AI-parsed query onto the same URL param names that
// parseSearchParams (lib/openalex/params.ts) reads. Pure and client-safe so
// the search bar can build the navigation URL without pulling in server-only
// AI code.
export function parsedQueryToSearchParams(
  parsed: ParsedSearchQuery,
): URLSearchParams {
  const sp = new URLSearchParams();
  if (parsed.searchTerm) sp.set("q", parsed.searchTerm);
  if (parsed.yearMin !== undefined) sp.set("year_min", String(parsed.yearMin));
  if (parsed.yearMax !== undefined) sp.set("year_max", String(parsed.yearMax));
  if (parsed.openAccessOnly) sp.set("oa_only", "true");
  if (parsed.sort) sp.set("sort", parsed.sort);
  if (parsed.sortDirection) sp.set("sort_dir", parsed.sortDirection);
  for (const type of parsed.types ?? []) sp.append("type", type);
  for (const continent of parsed.continents ?? [])
    sp.append("continent", continent);
  for (const country of parsed.countries ?? []) sp.append("country", country);
  return sp;
}
