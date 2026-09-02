"use server";

import type { StreamableValue } from "@ai-sdk/rsc";

import { streamChatReply } from "@/lib/ai/chat";
import { NoContentError, streamWorkSummary } from "@/lib/ai/summary";
import {
  NO_CONTENT,
  type AskResult,
  type ChatMessage,
  type SummarizeResult,
  type SummaryInput,
} from "@/lib/ai/types";

export type { AskResult, ChatMessage, SummarizeResult };

export async function summarizeWork(
  input: SummaryInput,
): Promise<
  | { ok: true; stream: StreamableValue<string> }
  | { ok: false; error: string; code?: "NO_CONTENT" }
> {
  try {
    const stream = await streamWorkSummary(input);
    return { ok: true, stream };
  } catch (error) {
    if (error instanceof NoContentError) {
      return { ok: false, error: NO_CONTENT, code: "NO_CONTENT" };
    }
    const message =
      error instanceof Error ? error.message : "Failed to generate summary.";
    return { ok: false, error: message };
  }
}

export async function askAboutWork(
  input: SummaryInput,
  history: ChatMessage[],
): Promise<AskResult> {
  try {
    const stream = await streamChatReply(input, history);
    return { ok: true, stream };
  } catch (error) {
    if (error instanceof NoContentError) {
      return { ok: false, error: NO_CONTENT, code: "NO_CONTENT" };
    }
    const message =
      error instanceof Error ? error.message : "Failed to generate reply.";
    return { ok: false, error: message };
  }
}
