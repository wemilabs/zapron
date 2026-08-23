import { xai } from "@ai-sdk/xai";
import { generateText } from "ai";
import { cacheLife } from "next/cache";

import { NO_CONTENT, type SummaryInput } from "@/lib/ai/types";
import { getArxivFullText } from "@/lib/arxiv/text";

export { NO_CONTENT, type SummaryInput };

// xAI model id for summary generation. Pinned here so a model change is one
// edit. grok-4.6 is the current flagship; see @ai-sdk/xai for alternatives.
export const MODEL = "grok-4.6";

const SYSTEM_PROMPT = `You are a research summarizer for Zapron, an academic search engine. Given a paper's title, authors, and full text (or abstract when full text is unavailable), produce a concise structured summary for a researcher scanning results.

Write exactly three sections, each starting with the section name on its own line, followed by 1-3 sentences:

Key findings
The main claims, results, or contributions of the paper.

Methods
How the work was done — the approach, data, or technique.

Significance
Why it matters, what gap it fills, or what it enables.

Rules:
- Plain text only. No markdown, no headers beyond the three section names, no bullet points.
- Be specific and concrete. Reference the actual method or result, not generic filler.
- Keep the whole summary under 250 words.
- If the text is truncated or partial, summarize what is available and do not speculate about missing parts.`;

// Summaries are deterministic given the same input text, so this is a safe cache
// boundary. Keyed by the SummaryInput fields (the argument becomes part of the
// cache key automatically). One LLM call per unique work; reused across visits.
export async function generateWorkSummary(
  input: SummaryInput,
): Promise<string> {
  "use cache";
  cacheLife("days");

  const body = await resolveContent(input);
  if (!body) return NO_CONTENT;

  const prompt = `Title: ${input.title}
Authors: ${input.authors}

${body}`;

  const { text } = await generateText({
    model: xai(MODEL),
    system: SYSTEM_PROMPT,
    prompt,
  });

  return text.trim();
}

async function resolveContent(input: SummaryInput): Promise<string | null> {
  if (input.arxivId) {
    const fullText = await getArxivFullText(input.arxivId);
    if (fullText) return `Full text:\n\n${fullText}`;
  }
  if (input.abstractText) return `Abstract:\n\n${input.abstractText}`;
  return null;
}
