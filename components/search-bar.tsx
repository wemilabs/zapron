"use client";

import { LoaderCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";

import { Input } from "@/components/ui/input";

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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPending, startTransition] = useTransition();

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

  function navigate(query: string, push = false) {
    startTransition(() => {
      const url = buildUrl(query);
      if (push) router.push(url);
      else router.replace(url);
    });
  }

  function handleInput(event: React.ChangeEvent<HTMLInputElement>) {
    const query = event.currentTarget.value.trim();
    if (timerRef.current) clearTimeout(timerRef.current);

    if (variant === "hero" && !query) return;
    if (query && query.length < LIVE_SEARCH_MIN_LENGTH) return;

    // Coalesce rapid keystrokes so live search does not spend one external API
    // request per character while keeping the input itself fully responsive.
    timerRef.current = setTimeout(() => navigate(query), LIVE_SEARCH_DELAY_MS);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (timerRef.current) clearTimeout(timerRef.current);
    const data = new FormData(event.currentTarget);
    const query = String(data.get("q") ?? "").trim();
    if (query) navigate(query, true);
  }

  const isHero = variant === "hero";

  return (
    <form
      onSubmit={handleSubmit}
      className={isHero ? "w-full max-w-2xl" : "w-full"}
      aria-label="Search academic works"
    >
      <div className="relative">
        {isPending ? (
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
          name="q"
          defaultValue={initialValueRef.current}
          onChange={handleInput}
          placeholder={
            isHero ? "Search academic papers, authors, topics…" : "Search…"
          }
          className={
            isHero ? "h-14 rounded-lg px-12 text-base shadow-sm" : "h-10 pl-10"
          }
          autoComplete="off"
          autoFocus
        />
      </div>
    </form>
  );
}
