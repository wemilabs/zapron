import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { FullText, FullTextSkeleton } from "@/components/full-text";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { arxivIdFromDoi } from "@/lib/arxiv/client";
import { OpenAlexError } from "@/lib/openalex/client";
import {
  formatAuthors,
  formatVenue,
  getCitation,
  getDoiUrl,
  getOpenAccessUrl,
  normalizeWorkId,
} from "@/lib/openalex/format";
import type { Work } from "@/lib/openalex/types";
import {
  getCitingWorks,
  getReferencedWorks,
  getWorkDetail,
} from "@/lib/openalex/work";

interface WorkDetailProps {
  params: Promise<{ id: string }>;
}

export async function WorkDetail({ params }: WorkDetailProps) {
  const { id } = await params;
  const workId = normalizeWorkId(id);

  try {
    const work = await getWorkDetail(workId);
    const [references, citations] = await Promise.all([
      getReferencedWorks(work.referenced_works ?? []),
      getCitingWorks(workId),
    ]);

    const venue = formatVenue(work);
    const oaUrl = getOpenAccessUrl(work);
    const doiUrl = getDoiUrl(work);
    const arxivId = arxivIdFromDoi(work.doi) ?? work.ids?.arxiv_id ?? null;
    const concepts = (work.concepts ?? [])
      .filter((concept) => (concept.score ?? 0) >= 0.3)
      .slice(0, 8);

    return (
      <article className="flex flex-col gap-8">
        <header className="flex flex-col gap-4 border-b pb-8">
          <div className="flex flex-wrap items-center gap-2">
            {work.type && (
              <Badge variant="outline">{formatType(work.type)}</Badge>
            )}
            {work.open_access?.is_oa && (
              <Badge variant="secondary" className="text-green-700">
                Open Access
              </Badge>
            )}
            {work.is_retracted && (
              <Badge variant="destructive">Retracted</Badge>
            )}
          </div>
          <h1 className="max-w-4xl text-3xl leading-tight font-semibold tracking-tight md:text-4xl">
            {work.display_name}
          </h1>
          <p className="text-base text-muted-foreground">
            {formatAuthors(work.authorships)}
          </p>
          <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {venue && <span className="italic">{venue}</span>}
            {work.publication_year && (
              <>
                <span aria-hidden>·</span>
                <span>{work.publication_year}</span>
              </>
            )}
            <span aria-hidden>·</span>
            <span>{(work.cited_by_count ?? 0).toLocaleString()} citations</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {oaUrl && (
              <a
                href={oaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium underline-offset-2 hover:underline"
              >
                Read full text <ExternalLink className="size-3.5" />
              </a>
            )}
            {doiUrl && (
              <a
                href={doiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                DOI <ExternalLink className="size-3.5" />
              </a>
            )}
            <a
              href={work.id}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              OpenAlex <ExternalLink className="size-3.5" />
            </a>
          </div>
        </header>

        <Tabs defaultValue="abstract" className="gap-6">
          <TabsList
            variant="line"
            className="no-scrollbar w-full justify-start gap-5 overflow-x-auto scroll-fade-e border-b"
          >
            <TabsTrigger value="abstract" className="flex-none">
              Abstract
            </TabsTrigger>
            {arxivId && (
              <TabsTrigger value="full-text" className="flex-none">
                Full text
              </TabsTrigger>
            )}
            <TabsTrigger value="references" className="flex-none">
              References ({work.referenced_works?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="cited-by" className="flex-none">
              Cited by {(work.cited_by_count ?? 0).toLocaleString()}
            </TabsTrigger>
            <TabsTrigger value="details" className="flex-none">
              Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="abstract" className="max-w-3xl">
            {work.abstractText ? (
              <p className="text-base leading-8 text-foreground/85">
                {work.abstractText}
              </p>
            ) : (
              <EmptyState>No abstract is available for this work.</EmptyState>
            )}
          </TabsContent>

          {arxivId && (
            <TabsContent value="full-text">
              <Suspense fallback={<FullTextSkeleton />}>
                <FullText arxivId={arxivId} />
              </Suspense>
            </TabsContent>
          )}

          <TabsContent value="references">
            <WorkList
              works={references.results}
              empty="No references are indexed."
            />
            {(work.referenced_works?.length ?? 0) >
              references.results.length && (
              <p className="mt-4 text-sm text-muted-foreground">
                Showing the first {references.results.length} indexed
                references.
              </p>
            )}
          </TabsContent>

          <TabsContent value="cited-by">
            <WorkList
              works={citations.results}
              empty="No citing works are indexed."
            />
            {(work.cited_by_count ?? 0) > citations.results.length && (
              <p className="mt-4 text-sm text-muted-foreground">
                Showing the 10 most-cited works that cite this paper.
              </p>
            )}
          </TabsContent>

          <TabsContent value="details">
            <div className="grid max-w-3xl gap-6 sm:grid-cols-2">
              <Detail
                label="Published"
                value={work.publication_date ?? "Unknown"}
              />
              <Detail label="Venue" value={venue ?? "Unknown"} />
              <Detail label="Citation" value={getCitation(work)} />
              <Detail
                label="Open access"
                value={formatOaStatus(work.open_access?.oa_status)}
              />
              <Detail
                label="DOI"
                value={work.doi?.replace("https://doi.org/", "") ?? "—"}
              />
              <Detail label="OpenAlex ID" value={workId} />
            </div>
            {work.authorships && work.authorships.length > 0 && (
              <section className="mt-8 flex max-w-3xl flex-col gap-3">
                <h2 className="text-lg font-semibold">Authors</h2>
                <ul className="divide-y">
                  {work.authorships.map((authorship) => (
                    <li
                      key={
                        authorship.author.id ?? authorship.author.display_name
                      }
                      className="py-3"
                    >
                      <p className="font-medium">
                        {authorship.author.display_name}
                      </p>
                      {authorship.institutions.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {authorship.institutions
                            .map((institution) => institution.display_name)
                            .join(", ")}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {concepts.length > 0 && (
              <section className="mt-8 flex max-w-3xl flex-col gap-3">
                <h2 className="text-lg font-semibold">Topics</h2>
                <div className="flex flex-wrap gap-2">
                  {concepts.map((concept) => (
                    <Badge key={concept.id} variant="secondary">
                      {concept.display_name}
                    </Badge>
                  ))}
                </div>
              </section>
            )}
          </TabsContent>
        </Tabs>
      </article>
    );
  } catch (error) {
    if (error instanceof OpenAlexError && error.status === 404) notFound();
    throw error;
  }
}

function WorkList({ works, empty }: { works: Work[]; empty: string }) {
  if (works.length === 0) return <EmptyState>{empty}</EmptyState>;

  return (
    <ol className="max-w-3xl divide-y">
      {works.map((work) => (
        <li key={work.id} className="py-4 first:pt-0">
          <Link
            href={`/work/${normalizeWorkId(work.id)}`}
            prefetch
            className="font-medium underline-offset-2 hover:underline"
          >
            {work.display_name}
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatAuthors(work.authorships)}
            {work.publication_year ? ` · ${work.publication_year}` : ""}
            {work.cited_by_count
              ? ` · ${work.cited_by_count.toLocaleString()} citations`
              : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <dl className="flex flex-col gap-1 border-b pb-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="wrap-break-word text-sm font-medium">{value}</dd>
    </dl>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-sm text-muted-foreground">{children}</p>;
}

function formatType(type: string) {
  return type.replaceAll("-", " ");
}

function formatOaStatus(status: string | null | undefined) {
  if (!status) return "Closed or unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function WorkDetailSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 border-b pb-8">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-4/5" />
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <Skeleton className="h-8 w-96 max-w-full" />
      <div className="flex max-w-3xl flex-col gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}
