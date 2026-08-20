import { CompactSearchBar } from "@/components/compact-search-bar";
import { Filters } from "@/components/filters";
import { MobileFilters } from "@/components/mobile-filters";
import {
  SearchResults,
  SearchResultsSkeleton,
} from "@/components/search-results";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Suspense } from "react";

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="sticky top-0 z-10 -mx-6 mb-2 flex items-center gap-3 bg-background/80 px-6 py-4 backdrop-blur-sm">
        <a href="/" className="shrink-0">
          <Image
            src="/logo.png"
            alt="Zapron"
            width={32}
            height={32}
            className="block dark:hidden"
            priority
          />
          <Image
            src="/logo-dark.png"
            alt="Zapron"
            width={32}
            height={32}
            className="hidden dark:block"
            priority
          />
        </a>
        <div className="flex-1">
          <Suspense fallback={<Skeleton className="h-10 w-full" />}>
            <CompactSearchBar />
          </Suspense>
        </div>
        <div className="md:hidden">
          <Suspense fallback={<Skeleton className="h-9 w-20" />}>
            <MobileFilters />
          </Suspense>
        </div>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        <div className="min-w-0 flex-1">
          <Suspense fallback={<SearchResultsSkeleton />}>
            <SearchResults searchParams={searchParams} />
          </Suspense>
        </div>
        <div className="hidden w-56 shrink-0 md:sticky md:top-20 md:block md:h-fit">
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <Filters />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
