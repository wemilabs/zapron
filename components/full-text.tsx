import { ExternalLink } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { getArxivHtml } from "@/lib/arxiv/html";

interface FullTextProps {
  arxivId: string;
}

export async function FullText({ arxivId }: FullTextProps) {
  const paper = await getArxivHtml(arxivId);

  if (!paper) {
    return (
      <p className="py-8 text-sm text-muted-foreground">
        Full text rendering is not available for this paper. It may be too old
        for arXiv&rsquo;s HTML conversion, or the paper is not from arXiv.
      </p>
    );
  }

  return (
    <div className="min-w-0 max-w-full overflow-hidden">
      <div className="mb-6 flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Rendered from arXiv HTML. Math uses MathML and may not display in all
          browsers.
        </p>
        <a
          href={`https://arxiv.org/abs/${paper.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          View on arXiv <ExternalLink className="size-3.5" />
        </a>
      </div>
      <div
        className="arxiv-full-text min-w-0 max-w-full text-base leading-8 text-foreground/85"
        // The HTML is sanitized server-side via sanitize-html before caching.
        // Only MathML, standard semantic HTML, and ltx_* classes survive.
        // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized server-side
        dangerouslySetInnerHTML={{ __html: paper.html }}
      />
    </div>
  );
}

export function FullTextSkeleton() {
  return (
    <div className="flex max-w-3xl flex-col gap-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}
