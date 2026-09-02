// Pure types and constants shared between the server-only summary generator
// and the client UI. This file must not import anything server-only (no
// "next/cache", no "ai", no "use cache") so it is safe to bundle into the
// client. Type-only imports from @ai-sdk/rsc are safe — they erase at build.
import type { StreamableValue } from "@ai-sdk/rsc";

export interface SummaryInput {
  workId: string;
  arxivId: string | null;
  title: string;
  authors: string;
  abstractText: string | null;
  pdfUrl?: string | null;
}

// Sentinel returned when there's nothing to summarize. The action and UI
// translate this into a friendly empty state rather than an error.
export const NO_CONTENT = "NO_CONTENT";

export type SummarizeResult =
  | { ok: true; summary: string }
  | { ok: false; error: string };

// Output of parsing a natural-language search query into OpenAlex filter
// params. Mirrors the subset of SearchParams the AI is allowed to populate;
// pagination/cursor are left to the search page. All fields are optional
// except the core search term.
export interface ParsedSearchQuery {
  searchTerm: string;
  yearMin?: number;
  yearMax?: number;
  types?: string[];
  openAccessOnly?: boolean;
  continents?: string[];
  countries?: string[];
  sort?: "relevance_score" | "publication_date" | "cited_by_count";
  sortDirection?: "asc" | "desc";
}

export type ParseSearchResult =
  | { ok: true; query: ParsedSearchQuery }
  | { ok: false; error: string };

// Q&A chat on a paper. The input reuses SummaryInput (same paper context);
// history is the prior turns sent to the model for multi-turn conversation.
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type AskResult =
  | { ok: true; stream: StreamableValue<string> }
  | { ok: false; error: string; code?: "NO_CONTENT" };
