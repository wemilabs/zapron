import Link from "next/link";

import { SearchBar } from "@/components/search-bar";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="flex flex-col items-center gap-10 text-center">
        <div className="flex flex-col gap-3">
          <h1 className="text-5xl font-semibold tracking-tight text-foreground">
            Zapron
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            Search academic papers across the global research record. Beyond
            Google Scholar.
          </p>
        </div>
        <SearchBar variant="hero" />
        <p className="text-sm text-muted-foreground">
          Powered by{" "}
          <Link
            href="https://openalex.org"
            className="font-medium text-foreground underline-offset-4 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenAlex
          </Link>
        </p>
      </div>
    </main>
  );
}
