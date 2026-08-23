"use client";

import { readStreamableValue, type StreamableValue } from "@ai-sdk/rsc";
import { Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { summarizeWork } from "@/app/work/[id]/actions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { SummaryInput } from "@/lib/ai/types";

interface AiSummaryProps {
  input: SummaryInput;
}

// Cache a completed summary in localStorage so switching tabs or navigating
// away and back doesn't re-stream (and re-pay for) the same generation.
// Keyed by workId; expires after CACHE_TTL_MS.
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CACHE_PREFIX = "zapron:summary:";

type Status = "streaming" | "done" | "error" | "empty";

interface CachedSummary {
  text: string;
  cachedAt: number;
}

function readCache(workId: string): string | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + workId);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CachedSummary;
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_PREFIX + workId);
      return null;
    }
    return entry.text;
  } catch {
    return null;
  }
}

function writeCache(workId: string, text: string): void {
  try {
    const entry: CachedSummary = { text, cachedAt: Date.now() };
    localStorage.setItem(CACHE_PREFIX + workId, JSON.stringify(entry));
  } catch {
    // localStorage may be unavailable (private mode, quota) — degrade to
    // re-streaming on every visit. Not worth surfacing to the user.
  }
}

function clearCache(workId: string): void {
  try {
    localStorage.removeItem(CACHE_PREFIX + workId);
  } catch {
    // ignore
  }
}

export function AiSummary({ input }: AiSummaryProps) {
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<Status>("streaming");
  const [error, setError] = useState("");
  // Bumped to force a re-stream (regenerate). The effect depends on it.
  const [generation, setGeneration] = useState(0);
  // Tracks the active stream so a stale one can't write state after a new
  // generation starts.
  const activeGenRef = useRef(0);

  useEffect(() => {
    // generation is an intentional re-trigger (regenerate); not read in the
    // body but must be in the deps so the effect re-runs on bump.
    void generation;
    const cached = readCache(input.workId);
    if (cached) {
      setSummary(cached);
      setStatus("done");
      return;
    }

    // Increment the generation counter on the ref so the async closure can
    // detect if a newer generation has superseded it.
    const myGen = activeGenRef.current + 1;
    activeGenRef.current = myGen;
    let cancelled = false;

    setStatus("streaming");
    setSummary("");

    (async () => {
      const result = await summarizeWork(input);
      if (cancelled || activeGenRef.current !== myGen) return;

      if (!result.ok) {
        if (result.code === "NO_CONTENT") {
          setStatus("empty");
        } else {
          setError(result.error);
          setStatus("error");
        }
        return;
      }

      let accumulated = "";
      for await (const delta of readStreamableValue(
        result.stream as StreamableValue<string>,
      )) {
        if (cancelled || activeGenRef.current !== myGen) return;
        accumulated += delta ?? "";
        setSummary(accumulated);
      }

      if (cancelled || activeGenRef.current !== myGen) return;
      writeCache(input.workId, accumulated);
      setStatus("done");
    })();

    return () => {
      cancelled = true;
    };
  }, [input, generation]);

  function handleRegenerate() {
    clearCache(input.workId);
    setGeneration((g) => g + 1);
  }

  if (status === "empty") {
    return (
      <p className="py-8 text-sm text-muted-foreground">
        No content is available to summarize. This work has not provided any abstract or
        arXiv full text.
      </p>
    );
  }

  if (status === "error") {
    return (
      <div className="flex max-w-3xl flex-col gap-4">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleRegenerate}
        >
          <Sparkles className="size-3.5" />
          Try again
        </Button>
      </div>
    );
  }

  if (status === "streaming" && !summary) {
    return <SummarySkeleton />;
  }

  if (summary) {
    return (
      <div className="max-w-3xl">
        <p className="whitespace-pre-wrap text-base leading-8 text-foreground/85">
          {renderBoldSections(summary)}
          {status === "streaming" && <span className="animate-pulse">▋</span>}
        </p>
        {status === "done" && (
          <div className="mt-6 border-t pt-4">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleRegenerate}
            >
              <Sparkles className="size-3.5" />
              Regenerate
            </Button>
          </div>
        )}
      </div>
    );
  }

  return <SummarySkeleton />;
}


function renderBoldSections(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  match = regex.exec(text);
  while (match !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <strong key={`bold-${key++}`} className="font-semibold text-foreground">
        {match[1]}
      </strong>,
    );
    lastIndex = regex.lastIndex;
    match = regex.exec(text);
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function SummarySkeleton() {
  return (
    <div className="flex max-w-3xl flex-col gap-3">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="size-3.5 animate-pulse" />
        Zapron AI is reading the paper and writing the summary…
      </p>
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-5 w-28 mt-2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-5 w-36 mt-2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}
