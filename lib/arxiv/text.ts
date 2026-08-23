import { cacheLife } from "next/cache";

import { getArxivHtml } from "./html";

// Cap the amount of text we send to the model. Long papers blow past model
// context windows and run up cost; this truncation keeps the call bounded.
export const MAX_FULL_TEXT_CHARS = 80_000;

// Convert sanitized article HTML to plain text suitable for an LLM prompt.
// MathML is stripped (the model can't use it), tags are removed, and whitespace
// is collapsed. Good enough for a high-level summary; we lose math/figures but
// keep the prose structure.
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<math[\s\S]*?<\/math>/gi, " ")
    .replace(/<\/(p|div|section|h[1-6]|li|tr|br|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// arXiv HTML renderings are immutable per version, so this is a safe cache
// boundary. Keyed by the arXiv id (the argument becomes part of the cache key).
// Returns null when arXiv has no HTML rendering for the paper.
export async function getArxivFullText(
  arxivId: string,
): Promise<string | null> {
  "use cache";
  cacheLife("days");

  const paper = await getArxivHtml(arxivId);
  if (!paper) return null;

  const text = htmlToText(paper.html);
  if (text.length <= MAX_FULL_TEXT_CHARS) return text;
  return `${text.slice(0, MAX_FULL_TEXT_CHARS)}\n\n[truncated]`;
}
