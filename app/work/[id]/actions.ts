"use server";

import { generateWorkSummary } from "@/lib/ai/summary";
import type { SummarizeResult, SummaryInput } from "@/lib/ai/types";

export type { SummarizeResult };

// Wraps generateWorkSummary so the client never has to handle thrown errors.
// A missing API key or a provider failure becomes a typed error result the UI
// can render with a retry button.
export async function summarizeWork(
  input: SummaryInput,
): Promise<SummarizeResult> {
  try {
    const summary = await generateWorkSummary(input);
    return { ok: true, summary };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate summary.";
    return { ok: false, error: message };
  }
}
