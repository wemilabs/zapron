import { Suspense } from "react";

import { CompactSearchBar } from "@/components/compact-search-bar";
import { Filters } from "@/components/filters";
import {
  SearchResults,
  SearchResultsSkeleton,
} from "@/components/search-results";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex items-center gap-4">
        <a href="/" className="text-lg font-semibold text-foreground">
          Zapron
        </a>
        <div className="flex-1">
          <Suspense fallback={<Skeleton className="h-10 w-full" />}>
            <CompactSearchBar />
          </Suspense>
        </div>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        <div className="order-2 min-w-0 flex-1 md:order-1">
          <Suspense fallback={<SearchResultsSkeleton />}>
            <SearchResults searchParams={searchParams} />
          </Suspense>
        </div>
        <div className="order-1 w-full md:order-2 md:sticky md:top-8 md:h-fit md:w-56 md:shrink-0">
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <Filters />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
