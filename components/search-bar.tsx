"use client";

import { LoaderCircle, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { parseSearchQuery } from "@/app/search/actions";
import { Input } from "@/components/ui/input";
import { parsedQueryToSearchParams } from "@/lib/ai/query-url";
import { VoiceInput } from "./voice-input";

interface SearchBarProps {
  variant?: "hero" | "compact";
  defaultValue?: string;
  preserveParams?: URLSearchParams;
}

const LIVE_SEARCH_DELAY_MS = 150;
const LIVE_SEARCH_MIN_LENGTH = 2;

export function SearchBar({
  variant = "hero",
  defaultValue = "",
  preserveParams,
}: SearchBarProps) {
  const router = useRouter();
  const initialValueRef = useRef(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPending, startTransition] = useTransition();
  const [askAi, setAskAi] = useState(false);
  const [isParsing, startParse] = useTransition();

  function buildUrl(query: string) {
    const next = new URLSearchParams();
    if (query) next.set("q", query);

    if (variant === "compact" && preserveParams) {
      for (const key of [
        "year_min",
        "year_max",
        "oa_only",
        "sort",
        "sort_dir",
      ]) {
        const value = preserveParams.get(key);
        if (value) next.set(key, value);
      }
      for (const type of preserveParams.getAll("type")) {
        next.append("type", type);
      }
      for (const continent of preserveParams.getAll("continent")) {
        next.append("continent", continent);
      }
      for (const country of preserveParams.getAll("country")) {
        next.append("country", country);
      }
    }

    const queryString = next.toString();
    return (queryString ? `/search?${queryString}` : "/search") as Parameters<
      typeof router.replace
    >[0];
  }

  function navigateTo(url: Parameters<typeof router.replace>[0], push = false) {
    startTransition(() => {
      if (push) router.push(url);
      else router.replace(url);
    });
  }

  function navigate(query: string, push = false) {
    navigateTo(buildUrl(query), push);
  }

  function handleInput(event: React.ChangeEvent<HTMLInputElement>) {
    const query = event.currentTarget.value.trim();
    if (timerRef.current) clearTimeout(timerRef.current);

    if (askAi) return;

    if (variant === "hero" && !query) return;
    if (query && query.length < LIVE_SEARCH_MIN_LENGTH) return;

    timerRef.current = setTimeout(() => navigate(query), LIVE_SEARCH_DELAY_MS);
  }

  async function handleAskAiSubmit(query: string) {
    if (!query) return;
    startParse(async () => {
      const result = await parseSearchQuery(query);
      const url = result.ok
        ? `/search?${parsedQueryToSearchParams(result.query).toString()}`
        : buildUrl(query);
      navigateTo(url as Parameters<typeof router.replace>[0], true);
    });
  }

  function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (timerRef.current) clearTimeout(timerRef.current);
    const data = new FormData(event.currentTarget);
    const query = String(data.get("q") ?? "").trim();
    if (!query) return;
    if (askAi) {
      handleAskAiSubmit(query);
    } else {
      navigate(query, true);
    }
  }

  function toggleAskAi() {
    setAskAi((prev) => !prev);
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  function handleVoiceTranscript(text: string) {
    if (inputRef.current) {
      inputRef.current.value = text;
    }
    if (askAi) {
      handleAskAiSubmit(text);
    } else {
      navigate(text, true);
    }
  }

  const isHero = variant === "hero";
  const busy = isPending || isParsing;

  return (
    <form
      onSubmit={handleSubmit}
      className={isHero ? "w-full max-w-2xl" : "w-full"}
      aria-label="Search academic works"
    >
      <div className="relative">
        {busy ? (
          <LoaderCircle
            className={`pointer-events-none absolute top-1/2 animate-spin text-muted-foreground ${
              isHero
                ? "left-4 size-5 -translate-y-1/2"
                : "left-3 size-4 -translate-y-1/2"
            }`}
          />
        ) : (
          <Search
            className={`pointer-events-none absolute top-1/2 text-muted-foreground ${
              isHero
                ? "left-4 size-5 -translate-y-1/2"
                : "left-3 size-4 -translate-y-1/2"
            }`}
          />
        )}
        <Input
          ref={inputRef}
          name="q"
          defaultValue={initialValueRef.current}
          onChange={handleInput}
          placeholder={
            askAi
              ? "Describe what you're looking for in plain English…"
              : isHero
                ? "Search academic papers, authors, topics…"
                : "Search…"
          }
          className={
            isHero
              ? "h-14 rounded-lg px-12 pr-36 text-base shadow-sm"
              : "h-10 pl-10 pr-14"
          }
          autoComplete="off"
          autoFocus
        />
        <div
          className={`absolute top-1/2 -translate-y-1/2 flex items-center ${
            isHero ? "right-3" : "right-2"
          }`}
        >
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            size={isHero ? "icon" : "icon-sm"}
          />
          <button
            type="button"
            onClick={toggleAskAi}
            aria-pressed={askAi}
            title="Ask AI to parse your query into filters"
            className={`inline-flex items-center gap-1 rounded-md text-xs font-medium transition-colors ${
              isHero ? "px-2.5 py-1.5" : "px-2 py-1"
            } ${
              askAi
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className={isHero ? "size-4" : "size-3.5"} />
            Ask AI
          </button>
        </div>
      </div>
    </form>
  );
}
