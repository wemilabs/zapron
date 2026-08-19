"use client";

import { useSearchParams } from "next/navigation";

import { SearchBar } from "@/components/search-bar";

// useSearchParams() must be inside <Suspense> under Cache Components.
// This client wrapper reads params and forwards them to the SearchBar.
export function CompactSearchBar() {
  const params = useSearchParams();
  return (
    <SearchBar
      variant="compact"
      defaultValue={params.get("q") ?? ""}
      preserveParams={params}
    />
  );
}
