import Link from "next/link";

import { Button } from "@/components/ui/button";

interface PaginationProps {
  count: number;
  perPage: number;
  currentPage: number;
  basePath: string;
  // The full current query string (without the page param).
  queryString: string;
  // Whether there's a next page (OpenAlex cursor-based; we approximate with page math).
  hasNext: boolean;
}

export function Pagination({
  count,
  perPage,
  currentPage,
  basePath,
  queryString,
  hasNext,
}: PaginationProps) {
  const totalPages = Math.ceil(count / perPage);
  if (totalPages <= 1) return null;

  const buildHref = (page: number) => {
    const params = new URLSearchParams(queryString);
    params.set("page", String(page));
    params.delete("cursor");
    return `${basePath}?${params.toString()}` as Parameters<
      typeof Link
    >[0]["href"];
  };

  const hasPrev = currentPage > 1;

  return (
    <nav
      className="flex items-center justify-center gap-4"
      aria-label="Pagination"
    >
      {hasPrev ? (
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href={buildHref(currentPage - 1)} />}
        >
          Previous
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Previous
        </Button>
      )}
      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>
      {hasNext ? (
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href={buildHref(currentPage + 1)} />}
        >
          Next
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Next
        </Button>
      )}
    </nav>
  );
}
