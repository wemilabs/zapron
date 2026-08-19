import { SearchX } from "lucide-react";

import { Pagination } from "@/components/pagination";
import { ResultCard } from "@/components/result-card";
import { Skeleton } from "@/components/ui/skeleton";
import { parseSearchParams } from "@/lib/openalex/params";
import { searchWorks } from "@/lib/openalex/search";

const SKELETON_IDS = ["one", "two", "three", "four", "five"];

interface SearchResultsProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function SearchResults({ searchParams }: SearchResultsProps) {
  const sp = await searchParams;
  const params = parseSearchParams(sp);

  if (!params.query) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <SearchX className="size-8 text-muted-foreground" />
        <p className="text-muted-foreground">
          Enter a search query to find academic papers.
        </p>
      </div>
    );
  }

  const response = await searchWorks(params);
  const { results, meta } = response;

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <SearchX className="size-8 text-muted-foreground" />
        <p className="text-muted-foreground">
          No results for &ldquo;{params.query}&rdquo;.
        </p>
      </div>
    );
  }

  const currentPage = params.page ?? 1;
  const hasNext = currentPage * (params.perPage ?? 25) < meta.count;
  const paginationParams = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (!value || key === "page" || key === "cursor") continue;
    if (Array.isArray(value)) {
      for (const item of value) paginationParams.append(key, item);
    } else {
      paginationParams.set(key, value);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {meta.count.toLocaleString()} results for &ldquo;{params.query}&rdquo;
      </p>
      <div className="flex flex-col gap-4">
        {results.map((work) => (
          <ResultCard key={work.id} work={work} />
        ))}
      </div>
      <Pagination
        count={meta.count}
        perPage={params.perPage ?? 25}
        currentPage={currentPage}
        basePath="/search"
        queryString={paginationParams.toString()}
        hasNext={hasNext}
      />
    </div>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-5 w-48" />
      <div className="flex flex-col gap-4">
        {SKELETON_IDS.map((id) => (
          <div
            key={id}
            className="flex flex-col gap-3 rounded-xl ring-1 ring-foreground/10 p-4"
          >
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </div>
    </div>
  );
}
