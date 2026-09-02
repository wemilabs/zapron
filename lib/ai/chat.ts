import { createStreamableValue, type StreamableValue } from "@ai-sdk/rsc";
import { createXai } from "@ai-sdk/xai";
import { streamText } from "ai";

import { resolveContent } from "@/lib/ai/content";
import { NoContentError } from "@/lib/ai/summary";
import type { ChatMessage, SummaryInput } from "@/lib/ai/types";

const MODEL = process.env.GROK_MODEL ?? "grok-4.6";

const xai = createXai({
  baseURL: process.env.XAI_API_BASE_URL,
  apiKey: process.env.XAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a research assistant for Zapron, an academic search engine. The user is reading a paper and asking questions about it. Answer using only the provided paper text. If the answer is not in the paper, say so plainly — do not fabricate or speculate.

Rules:
- Be concise and direct. Answer the specific question asked.
- Reference the paper's actual methods, results, or claims when relevant.
- Use plain prose. No markdown headers, no bullet points unless listing concrete items from the paper.
- If the user asks about something unrelated to the paper, redirect them to the paper's content.`;

// Cap history to the last 10 messages to bound token cost on long conversations.
const MAX_HISTORY = 10;

export async function streamChatReply(
  input: SummaryInput,
  history: ChatMessage[],
): Promise<StreamableValue<string>> {
  const body = await resolveContent(input);
  if (!body) throw new NoContentError();

  const stream = createStreamableValue<string>();

  (async () => {
    try {
      const messages = history
        .slice(-MAX_HISTORY)
        .map((m) => ({ role: m.role, content: m.content }));

      const { textStream } = streamText({
        model: xai(MODEL),
        system: `${SYSTEM_PROMPT}\n\nPaper context — Title: ${input.title}\nAuthors: ${input.authors}\n\n${body}`,
        messages,
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
