import { ExternalLink } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { normalizeWorkId } from "@/lib/openalex/format";
import { getWorkDetail } from "@/lib/openalex/work";
import { toOpenAlexHref } from "@/lib/semanticscholar/id";
import { getS2Paper, getS2Recommendations } from "@/lib/semanticscholar/paper";

interface RecommendationsProps {
  params: Promise<{ id: string }>;
}

export async function Recommendations({ params }: RecommendationsProps) {
  const { id } = await params;
  const workId = normalizeWorkId(id);
  const work = await getWorkDetail(workId);

  const paperResult = await getS2Paper(work);
  if (!paperResult.ok) {
    return paperResult.reason === "rate-limited" ? (
      <RateLimitedState />
    ) : (
      <NoMatchState />
    );
  }

  const recsResult = await getS2Recommendations(paperResult.paper.paperId, 10);
  if (!recsResult.ok) return <RateLimitedState />;

  const recommendations = recsResult.items;
  if (recommendations.length === 0) {
    return (
      <p className="py-8 text-sm text-muted-foreground">
        No recommendations are available for this work.
      </p>
    );
  }

  return (
    <ol className="max-w-3xl divide-y">
      {recommendations.map((rec) => {
        const href = toOpenAlexHref(rec);
        const title = rec.title ?? "Untitled";
        const year = rec.year ? ` · ${rec.year}` : "";
        const citations = rec.citationCount
          ? ` · ${rec.citationCount.toLocaleString()} citations`
          : "";

        return (
          <li key={rec.paperId} className="py-4 first:pt-0">
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline-offset-2 hover:underline"
              >
                {title}
              </a>
            ) : (
              <span className="font-medium">{title}</span>
            )}
            {rec.abstract && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {rec.abstract}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {year}
              {citations}
              {!href && rec.url && (
                <>
                  {" · "}
                  <a
                    href={rec.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
                  >
                    Semantic Scholar <ExternalLink className="size-3" />
                  </a>
                </>
              )}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function RateLimitedState() {
  return (
    <p className="py-8 text-sm text-muted-foreground">
      Semantic Scholar is rate-limiting requests. Please try again in a moment,
      or set <code className="font-mono">SEMANTIC_SCHOLAR_API_KEY</code> for
      higher limits.
    </p>
  );
}

function NoMatchState() {
  return (
    <p className="py-8 text-sm text-muted-foreground">
      Recommendations are not available for this work. Semantic Scholar
      couldn&rsquo;t match it by DOI or arXiv id.
    </p>
  );
}

export function RecommendationsSkeleton() {
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton list, no stable id available
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
