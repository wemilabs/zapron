import { cacheLife } from "next/cache";

import { fetchAuthors } from "./client";
import type { OpenAlexAuthor } from "./types";

const MIN_TOKENS = 2;
const MAX_TOKENS = 4;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokensMatchName(tokens: string[], name: string): boolean {
  const nameTokens = new Set(normalize(name).split(" "));
  return tokens.every((token) => nameTokens.has(token));
}

function matchesAuthor(tokens: string[], author: OpenAlexAuthor): boolean {
  if (tokensMatchName(tokens, author.display_name)) return true;
  return (author.display_name_alternatives ?? []).some((alternative) =>
    tokensMatchName(tokens, alternative),
  );
}

// Resolve a query to an author only when it clearly looks like a person name:
// short (2-4 tokens), unquoted, and every token appears in the candidate's
// display name (or an alternative). Returns null for topic/title queries.
export async function resolveAuthor(
  query: string,
): Promise<OpenAlexAuthor | null> {
  "use cache";
  cacheLife("hours");

  const trimmed = query.trim();
  if (trimmed.startsWith('"') || trimmed.endsWith('"')) return null;

  const tokens = normalize(trimmed).split(" ").filter(Boolean);
  if (tokens.length < MIN_TOKENS || tokens.length > MAX_TOKENS) return null;

  const { results } = await fetchAuthors({
    search: trimmed,
    per_page: 5,
  });

  return (
    results.find(
      (author: OpenAlexAuthor) =>
        (author.works_count ?? 0) > 0 && matchesAuthor(tokens, author),
    ) ?? null
  );
}
