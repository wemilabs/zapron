import { createStreamableValue, type StreamableValue } from "@ai-sdk/rsc";
import { createXai } from "@ai-sdk/xai";
import { streamText } from "ai";

import { NO_CONTENT, type SummaryInput } from "@/lib/ai/types";
import { getArxivFullText } from "@/lib/arxiv/text";

export { NO_CONTENT, type SummaryInput };

const MODEL = process.env.GROK_MODEL ?? "grok-4.6";

const xai = createXai({
  baseURL: process.env.XAI_API_BASE_URL,
  apiKey: process.env.XAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a research summarizer for Zapron, an academic search engine. Given a paper's title, authors, and full text (or abstract when full text is unavailable), produce a concise structured summary for a researcher scanning results.

Write exactly five sections, each starting with the section name in **bold** on its own line, followed by 1-3 sentences:

**Key findings**
The main claims, results, or contributions of the paper.

**Methods**
The approach, data, or technique behind the work.

**Significance**
Why it matters, what gap it fills, or what it enables.

**Limitations**
The gaps, weaknesses, or boundaries of the work: what the paper does not address, where it stops, or what it assumes.

**Future work**
The directions, improvements, or research the paper suggests or that follow from it.

Rules:
- Wrap each section name in double asterisks for bold, like **Key findings**. Use bold only for section names, nowhere else.
- No other markdown, no headers beyond the five section names, no bullet points.
- Be specific and concrete. Reference the actual method or result, not generic filler.
- For Limitations and Future work, ground claims in what the paper actually says. If the paper does not discuss limitations or future work explicitly, infer them from the methods and results but keep it brief.
- Keep the whole summary under 500 words.
- If the text is truncated or partial, summarize what is available and do not speculate about missing parts.`;

export async function streamWorkSummary(
  input: SummaryInput,
): Promise<StreamableValue<string>> {
  const body = await resolveContent(input);
  if (!body) throw new NoContentError();

  const stream = createStreamableValue<string>();

  (async () => {
    try {
      const { textStream } = streamText({
        model: xai(MODEL),
        system: SYSTEM_PROMPT,
        prompt: `Title: ${input.title}\nAuthors: ${input.authors}\n\n${body}`,
      });

      for await (const delta of textStream) {
        stream.update(delta);
      }
      stream.done();
    } catch (error) {
      stream.error(error);
    }
  })();

  return stream.value;
}

export class NoContentError extends Error {
  constructor() {
    super(NO_CONTENT);
    this.name = "NoContentError";
  }
}

async function resolveContent(input: SummaryInput): Promise<string | null> {
  if (input.arxivId) {
    const fullText = await getArxivFullText(input.arxivId);
    if (fullText) return `Full text:\n\n${fullText}`;
  }
  if (input.abstractText) return `Abstract:\n\n${input.abstractText}`;
  return null;
}
