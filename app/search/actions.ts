"use server";

import { parseNaturalLanguageQuery } from "@/lib/ai/search";
import type { ParseSearchResult, ParsedSearchQuery } from "@/lib/ai/types";

export type { ParseSearchResult, ParsedSearchQuery };

// Parses a natural-language query into OpenAlex filter params. Falls back to
// the raw query string as a plain search term when AI parsing fails, so the
// user always lands on a working search.
export async function parseSearchQuery(
  query: string,
): Promise<ParseSearchResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { ok: false, error: "Empty query." };
  }

  try {
    const query2 = await parseNaturalLanguageQuery(trimmed);
    return { ok: true, query: query2 };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to parse query.";
    return { ok: false, error: message };
  }
}
