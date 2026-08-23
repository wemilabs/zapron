import { cacheLife } from "next/cache";

import {
  fetchS2Citations,
  fetchS2Paper,
  fetchS2Recommendations,
  fetchS2References,
} from "./client";
import { toS2PaperId } from "./id";
import type { S2Citation, S2Paper, S2Reference } from "./types";

interface OpenAlexWorkBridge {
  doi: string | null;
  ids?: { arxiv_id?: string | null } | null;
}

// Result types that encode failure modes without throwing. Throwing from
// inside "use cache" can bypass caller try/catch in dev mode, so we return
// a discriminated result instead.
export type S2PaperResult =
  | { ok: true; paper: S2Paper }
  | { ok: false; reason: "no-match" | "rate-limited" };

export type S2ListResult<T> =
  | { ok: true; items: T[] }
  | { ok: false; reason: "rate-limited" };

function isRateLimited(error: unknown): boolean {
  return (
    error instanceof Error &&
    "status" in error &&
    (error as { status: number }).status === 429
  );
}

function isNotFound(error: unknown): boolean {
  return (
    error instanceof Error &&
    "status" in error &&
    (error as { status: number }).status === 404
  );
}

// S2 paper metadata is effectively immutable per paperId, so this is a safe
// long cache boundary. Keyed by the OpenAlex work's DOI/arXiv id. Returns a
// discriminated result: { ok: false, reason: "no-match" } when no bridge or
// S2 has no record (404), { ok: false, reason: "rate-limited" } on 429.
// The 429 result is still cached, but with a short cacheLife so it revalidates
// quickly. We accept this tradeoff because throwing from "use cache" can
// bypass caller try/catch in dev mode.
export async function getS2Paper(
  work: OpenAlexWorkBridge,
): Promise<S2PaperResult> {
  "use cache";
  // Use a short cache for rate-limited results so they retry sooner. We can't
  // dynamically change cacheLife after the fetch, so we use a compromise:
  // a short "minutes" profile for the whole function. Real results (ok: true)
  // will still revalidate within minutes, which is fine for immutable paper
  // metadata in the context of a browsing session.
  cacheLife("minutes");

  const paperId = toS2PaperId(work);
  if (!paperId) return { ok: false, reason: "no-match" };

  try {
    const paper = await fetchS2Paper(paperId);
    return { ok: true, paper };
  } catch (error) {
    if (isNotFound(error)) return { ok: false, reason: "no-match" };
    if (isRateLimited(error)) return { ok: false, reason: "rate-limited" };
    throw error;
  }
}

// References (papers cited by the focus) are immutable once published.
export async function getS2References(
  paperId: string,
  limit: number,
): Promise<S2ListResult<S2Reference>> {
  "use cache";
  cacheLife("minutes");

  try {
    const res = await fetchS2References(paperId, limit);
    return { ok: true, items: res.data ?? [] };
  } catch (error) {
    if (isRateLimited(error)) return { ok: false, reason: "rate-limited" };
    throw error;
  }
}

// Citations (papers citing the focus) grow over time, so a shorter cache.
export async function getS2Citations(
  paperId: string,
  limit: number,
): Promise<S2ListResult<S2Citation>> {
  "use cache";
  cacheLife("minutes");

  try {
    const res = await fetchS2Citations(paperId, limit);
    return { ok: true, items: res.data ?? [] };
  } catch (error) {
    if (isRateLimited(error)) return { ok: false, reason: "rate-limited" };
    throw error;
  }
}

// Recommendations come from a stable model; cache for weeks.
export async function getS2Recommendations(
  paperId: string,
  limit: number,
): Promise<S2ListResult<S2Paper>> {
  "use cache";
  cacheLife("minutes");

  try {
    const res = await fetchS2Recommendations(paperId, limit);
    return { ok: true, items: res.recommendedPapers ?? [] };
  } catch (error) {
    if (isRateLimited(error)) return { ok: false, reason: "rate-limited" };
    throw error;
  }
}
