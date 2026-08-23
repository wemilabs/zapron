import { ExternalLink, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { OpenAlexAuthor } from "@/lib/openalex/types";

interface AuthorCardProps {
  author: OpenAlexAuthor;
}

export function AuthorCard({ author }: AuthorCardProps) {
  const institution = author.last_known_institutions?.[0]?.display_name;
  const hIndex = author.summary_stats?.h_index;

  return (
    <Card className="py-4">
      <CardContent className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted">
          <UserRound className="size-6 text-muted-foreground" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-heading text-base font-medium text-foreground">
              {author.display_name}
            </span>
            <Badge variant="secondary">Author</Badge>
            {author.orcid && (
              <a
                href={author.orcid}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-2 hover:underline"
              >
                <ExternalLink className="size-3.5" />
                ORCID
              </a>
            )}
          </div>
          {institution && (
            <span className="text-sm text-muted-foreground">{institution}</span>
          )}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {author.works_count !== null && (
              <span>{author.works_count.toLocaleString()} works</span>
            )}
            {author.cited_by_count !== null && (
              <>
                <span aria-hidden>·</span>
                <span>{author.cited_by_count.toLocaleString()} citations</span>
              </>
            )}
            {hIndex !== null && hIndex !== undefined && (
              <>
                <span aria-hidden>·</span>
                <span>h-index {hIndex}</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
