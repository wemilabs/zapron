import { XMLParser } from "fast-xml-parser";

import type { ArxivLink, ArxivPaper } from "./types";

// arXiv ToU require a descriptive User-Agent so they can reach us if a client
// misbehaves. Override via env for production deployments.
const USER_AGENT =
  process.env.ARXIV_USER_AGENT ?? "Zapron/0.1 (https://github.com/zapron)";

const BASE_URL = "https://export.arxiv.org/api/query";

export class ArxivError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ArxivError";
  }
}

// Strip the version suffix and the legacy archive prefix so callers can use the
// id as a stable cache key. "1706.03762v7" -> "1706.03762", "hep-th/9711200v2"
// -> "hep-th/9711200".
export function normalizeArxivId(id: string): string {
  return id.replace(/v\d+$/i, "");
}

// Extract an arXiv id from a DOI string. OpenAlex rarely populates ids.arxiv_id,
// but it does assign arXiv DOIs of the form 10.48550/arXiv.{id}. This is the
// reliable bridge. Returns null for non-arXiv DOIs.
export function arxivIdFromDoi(doi: string | null | undefined): string | null {
  if (!doi) return null;
  const match = doi.match(/10\.48550\/arxiv\.(.+)$/i);
  return match ? normalizeArxivId(match[1]) : null;
}

interface RawLink {
  "@_href": string;
  "@_rel": string;
  "@_type"?: string;
  "@_title"?: string;
}

interface RawEntry {
  id: string;
  title: string;
  summary: string;
  published?: string;
  updated?: string;
  link?: RawLink | RawLink[];
  author?: { name: string } | Array<{ name: string }>;
  category?: { "@_term": string } | Array<{ "@_term": string }>;
  "arxiv:primary_category"?: { "@_term": string };
  "arxiv:comment"?: string;
}

interface RawFeed {
  feed: {
    entry?: RawEntry | RawEntry[];
  };
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function parseLinks(raw: RawLink | RawLink[] | undefined): ArxivLink[] {
  return asArray(raw).map((l) => ({
    href: l["@_href"],
    rel: l["@_rel"],
    type: l["@_type"] ?? null,
    title: l["@_title"] ?? null,
  }));
}

function parseEntry(entry: RawEntry): ArxivPaper {
  const links = parseLinks(entry.link);
  const pdfLink = links.find((l) => l.rel === "related" && l.title === "pdf");
  const absLink = links.find((l) => l.rel === "alternate");

  const categories = asArray(entry.category).map((c) => c["@_term"]);
  const primary =
    entry["arxiv:primary_category"]?.["@_term"] ?? categories[0] ?? null;

  // The entry <id> is the versioned abs URL; derive the bare id from it.
  const absUrl = absLink?.href ?? entry.id;
  const idMatch = absUrl.match(/abs\/([^/?#]+)/i);
  const id = idMatch ? normalizeArxivId(idMatch[1]) : absUrl;

  return {
    id,
    absUrl,
    pdfUrl: pdfLink?.href ?? null,
    title: entry.title.trim(),
    summary: entry.summary.trim(),
    authors: asArray(entry.author).map((a) => a.name),
    primaryCategory: primary,
    categories,
    comment: entry["arxiv:comment"] ?? null,
    published: entry.published ?? null,
    updated: entry.updated ?? null,
  };
}

export async function fetchArxivPaper(
  arxivId: string,
): Promise<ArxivPaper | null> {
  const url = `${BASE_URL}?id_list=${encodeURIComponent(
    normalizeArxivId(arxivId),
  )}&max_results=1`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/atom+xml",
      "User-Agent": USER_AGENT,
    },
  });

  if (!res.ok) {
    throw new ArxivError(`arXiv request failed (${res.status})`, res.status);
  }

  const xml = await res.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  const parsed = parser.parse(xml) as RawFeed;

  const entry = parsed.feed?.entry;
  if (!entry) return null;

  const entries = asArray(entry);
  if (entries.length === 0) return null;

  return parseEntry(entries[0]);
}
