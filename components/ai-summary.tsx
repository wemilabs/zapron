"use client";

import { Sparkles } from "lucide-react";
import { useActionState } from "react";

import { summarizeWork } from "@/app/work/[id]/actions";
import { Button } from "@/components/ui/button";
import {
  NO_CONTENT,
  type SummarizeResult,
  type SummaryInput,
} from "@/lib/ai/types";

interface AiSummaryProps {
  input: SummaryInput;
}

export function AiSummary({ input }: AiSummaryProps) {
  const [state, formAction] = useActionState<SummarizeResult | null, FormData>(
    async () => summarizeWork(input),
    null,
  );

  if (state?.ok && state.summary === NO_CONTENT) {
    return <EmptyState />;
  }

  if (state?.ok) {
    return (
      <div className="max-w-3xl">
        <p className="whitespace-pre-wrap text-base leading-8 text-foreground/85">
          {state.summary}
        </p>
        <form action={formAction} className="mt-6 border-t pt-4">
          <Button type="submit" size="sm" variant="ghost">
            <Sparkles className="size-3.5" />
            Regenerate
          </Button>
        </form>
      </div>
    );
  }

  if (state && !state.ok) {
    return (
      <div className="flex max-w-3xl flex-col gap-4">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">{state.error}</p>
        </div>
        <form action={formAction}>
          <Button type="submit" size="sm" variant="outline">
            <Sparkles className="size-3.5" />
            Try again
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4 py-4">
      <p className="text-sm text-muted-foreground">
        Generate a structured AI summary of this paper with key findings, methods,
        and significance. Powered by Grok.
      </p>
      <form action={formAction}>
        <Button type="submit" size="sm">
          <Sparkles className="size-3.5" />
          Generate AI summary
        </Button>
      </form>
    </div>
  );
}

function EmptyState() {
  return (
    <p className="py-8 text-sm text-muted-foreground">
      No content is available to summarize. This work has no abstract and no
      arXiv full text.
    </p>
  );
}
