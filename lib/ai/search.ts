import { createXai } from "@ai-sdk/xai";
import { generateText, Output } from "ai";
import { cacheLife } from "next/cache";
import { z } from "zod";

import type { ParsedSearchQuery } from "@/lib/ai/types";

export type { ParsedSearchQuery };

const MODEL = process.env.GROK_MODEL ?? "grok-4.6";

const xai = createXai({
  baseURL: process.env.XAI_API_BASE_URL,
  apiKey: process.env.XAI_API_KEY,
});

const WORK_TYPES = [
  "article",
  "preprint",
  "review",
  "book",
  "book-chapter",
  "dissertation",
  "report",
  "dataset",
  "proceedings-article",
] as const;

const CONTINENTS = [
  "africa",
  "asia",
  "europe",
  "north_america",
  "oceania",
  "south_america",
] as const;

const SORT_FIELDS = [
  "relevance_score",
  "publication_date",
  "cited_by_count",
] as const;

const searchSchema = z.object({
  searchTerm: z
    .string()
    .describe(
      "The core search terms to look up in OpenAlex, as a plain keyword query.",
    ),
  yearMin: z
    .number()
    .int()
    .min(1900)
    .max(2100)
    .nullable()
    .describe("Earliest publication year, or null if unspecified."),
  yearMax: z
    .number()
    .int()
    .min(1900)
    .max(2100)
    .nullable()
    .describe("Latest publication year, or null if unspecified."),
  types: z
    .array(z.enum(WORK_TYPES))
    .nullable()
    .describe("Work types to filter to, or null/empty if unspecified."),
  openAccessOnly: z
    .boolean()
    .nullable()
    .describe(
      "True if the user wants only open-access works, else null/false.",
    ),
  continents: z
    .array(z.enum(CONTINENTS))
    .nullable()
    .describe("Continents to filter author affiliations by, or null/empty."),
  countries: z
    .array(
      z
        .string()
        .length(2)
        .describe("ISO 3166-1 alpha-2 country code, lowercase."),
    )
    .nullable()
    .describe("Country codes to filter author affiliations by, or null/empty."),
  sort: z
    .enum(SORT_FIELDS)
    .nullable()
    .describe("Sort field, or null to default to relevance_score."),
  sortDirection: z
    .enum(["asc", "desc"])
    .nullable()
    .describe("Sort direction, or null to default to desc."),
});

const SYSTEM_PROMPT = `You are a query parser for Zapron, an academic search engine backed by OpenAlex. Your job is to convert a researcher's natural-language request into structured OpenAlex search parameters.

Extract:
- searchTerm: the core topical keywords to search for. Strip filler like "papers about", "find me", "show me". Keep technical terms intact (e.g. "transformer architectures", "protein folding"). Prefer a concise keyword phrase over a full sentence.
- yearMin / yearMax: publication year bounds when the user mentions a date range, year, or recency (e.g. "since 2020" -> yearMin 2020; "last 5 years" -> yearMin = current year minus 4). Use null when not stated.
- types: work types from this fixed list only: ${WORK_TYPES.join(", ")}. Use null/empty when not stated.
- openAccessOnly: true only when the user explicitly asks for open-access or freely-available papers. Otherwise null/false.
- continents: from this fixed list only: ${CONTINENTS.join(", ")}. Use null/empty when not stated.
- countries: ISO 3166-1 alpha-2 country codes (lowercase) when the user mentions a country or region's institutions. Use null/empty when not stated.
- sort: one of ${SORT_FIELDS.join(", ")}. Default to null (relevance). Use "cited_by_count" only if the user asks for the most influential/cited works, and "publication_date" if they ask for the newest/most recent.
- sortDirection: "asc" or "desc". Default to null (desc).

Rules:
- Only populate fields the user actually expressed. Do not invent constraints.
- If the request is a plain keyword query with no filters, return just the searchTerm and leave everything else null.
- searchTerm must always be non-empty.`;

// Same natural-language query always maps to the same filters, so this is a
// safe cache boundary. Keyed by the query argument.
export async function parseNaturalLanguageQuery(
  query: string,
): Promise<ParsedSearchQuery> {
  "use cache";
  cacheLife("days");

  const trimmed = query.trim();
  const { output } = await generateText({
    model: xai(MODEL),
    system: SYSTEM_PROMPT,
    prompt: trimmed,
    output: Output.object({ schema: searchSchema }),
  });

  return normalizeOutput(output, trimmed);
}

function normalizeOutput(
  output: z.infer<typeof searchSchema>,
  fallback: string,
): ParsedSearchQuery {
  const searchTerm = output.searchTerm?.trim() || fallback;
  const types = output.types ?? [];
  const continents = output.continents ?? [];
  const countries = (output.countries ?? []).filter(Boolean);

  return {
    searchTerm,
    yearMin: output.yearMin ?? undefined,
    yearMax: output.yearMax ?? undefined,
    types: types.length ? types : undefined,
    openAccessOnly: output.openAccessOnly === true ? true : undefined,
    continents: continents.length ? continents : undefined,
    countries: countries.length ? countries : undefined,
    sort: output.sort ?? undefined,
    sortDirection: output.sortDirection ?? undefined,
  };
}
