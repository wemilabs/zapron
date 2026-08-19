import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BackButton } from "@/components/back-button";
import { WorkDetail, WorkDetailSkeleton } from "@/components/work-detail";
import { truncate } from "@/lib/openalex/abstract";
import { OpenAlexError } from "@/lib/openalex/client";
import { normalizeWorkId } from "@/lib/openalex/format";
import { getWorkDetail } from "@/lib/openalex/work";

interface WorkPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: WorkPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const work = await getWorkDetail(normalizeWorkId(id));
    const description = work.abstractText
      ? truncate(work.abstractText, 160)
      : `${work.display_name} on Zapron.`;

    return {
      title: work.display_name,
      description,
      alternates: work.doi ? { canonical: work.doi } : undefined,
      openGraph: {
        type: "article",
        title: work.display_name,
        description,
      },
    };
  } catch (error) {
    if (error instanceof OpenAlexError && error.status === 404) {
      return { title: "Work not found" };
    }
    throw error;
  }
}

export default function WorkPage({ params }: WorkPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-8 md:py-12">
      <nav className="flex items-center justify-between gap-4">
        <BackButton />
        <Link href="/" className="text-lg font-semibold">
          Zapron
        </Link>
      </nav>
      <Suspense fallback={<WorkDetailSkeleton />}>
        <WorkDetail params={params} />
      </Suspense>
    </main>
  );
}
