import { ExternalLink, FileText } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { truncate } from "@/lib/openalex/abstract";
import {
  formatAuthors,
  formatVenue,
  formatYear,
  getAbstract,
  getDoiUrl,
  getOpenAccessUrl,
  normalizeWorkId,
} from "@/lib/openalex/format";
import type { Work } from "@/lib/openalex/types";

interface ResultCardProps {
  work: Work;
}

export function ResultCard({ work }: ResultCardProps) {
  const id = normalizeWorkId(work.id);
  const authors = formatAuthors(work.authorships);
  const venue = formatVenue(work);
  const year = formatYear(work);
  const abstract = getAbstract(work);
  const oaUrl = getOpenAccessUrl(work);
  const doiUrl = getDoiUrl(work);
  const isOa = work.open_access?.is_oa ?? false;

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/work/${id}`}
            prefetch
            className="font-heading text-base leading-snug font-medium text-foreground underline-offset-2 hover:underline"
          >
            {work.display_name}
          </Link>
          <div className="flex shrink-0 items-center gap-1.5">
            {isOa && (
              <Badge variant="secondary" className="text-green-700">
                Open Access
              </Badge>
            )}
            {work.is_retracted && (
              <Badge variant="destructive">Retracted</Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span>{authors}</span>
          {venue && (
            <>
              <span aria-hidden>·</span>
              <span className="italic">{venue}</span>
            </>
          )}
          {year && (
            <>
              <span aria-hidden>·</span>
              <span>{year}</span>
            </>
          )}
          {work.cited_by_count !== null && work.cited_by_count > 0 && (
            <>
              <span aria-hidden>·</span>
              <span>
                {work.cited_by_count} citation{work.cited_by_count <= 1 ? "" : "s"}
              </span>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {abstract && (
          <p className="text-sm text-muted-foreground">
            {truncate(abstract, 280)}
          </p>
        )}
        <div className="flex items-center gap-3">
          <Link
            href={`/work/${id}`}
            prefetch
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-2 hover:underline"
          >
            <FileText className="size-3.5" />
            View details
          </Link>
          {oaUrl && (
            <a
              href={oaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-2 hover:underline"
            >
              <ExternalLink className="size-3.5" />
              Open PDF
            </a>
          )}
          {doiUrl && !oaUrl && (
            <a
              href={doiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-2 hover:underline"
            >
              <ExternalLink className="size-3.5" />
              DOI
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
