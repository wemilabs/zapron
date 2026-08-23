import type { Metadata } from "next";
import { Suspense } from "react";

import { BackButton } from "@/components/back-button";
import {
  CitationGraph,
  CitationGraphSkeleton,
} from "@/components/citation-graph";
import { OpenAlexError } from "@/lib/openalex/client";
import { truncate } from "@/lib/openalex/abstract";
import { normalizeWorkId } from "@/lib/openalex/format";
import { getWorkDetail } from "@/lib/openalex/work";

export const prefetch = "partial";

interface GraphPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: GraphPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const work = await getWorkDetail(normalizeWorkId(id));
    const description = work.abstractText
      ? truncate(work.abstractText, 160)
      : `Citation graph for ${work.display_name} on Zapron.`;

    return {
      title: `Citation graph: ${work.display_name}`,
      description,
    };
  } catch (error) {
    if (error instanceof OpenAlexError && error.status === 404) {
      return { title: "Work not found | Zapron" };
    }
    throw error;
  }
}

export default function GraphPage({ params }: GraphPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-8 md:py-12">
      <nav className="flex items-center gap-4">
        <BackButton />
      </nav>
      <Suspense fallback={<CitationGraphSkeleton />}>
        <CitationGraph params={params} />
      </Suspense>
    </main>
  );
}
