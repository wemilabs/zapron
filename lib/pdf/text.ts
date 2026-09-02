import { cacheLife } from "next/cache";
import { extractText, getDocumentProxy } from "unpdf";

// Same cap as arXiv full text — keeps the prompt within model context limits.
export const MAX_PDF_TEXT_CHARS = 80_000;

// OA PDFs are immutable per version, so this is a safe cache boundary.
// Keyed by the PDF URL (the argument becomes part of the cache key).
// Returns null when the PDF can't be fetched or has no extractable text layer
// (e.g. scanned/image-only PDFs).
export async function getPdfFullText(pdfUrl: string): Promise<string | null> {
  "use cache";
  cacheLife("days");

  try {
    const response = await fetch(pdfUrl);
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("pdf") && !contentType.includes("octet-stream")) {
      return null;
    }

    const buffer = await response.arrayBuffer();
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });

    if (typeof text !== "string" || !text.trim()) return null;

    if (text.length <= MAX_PDF_TEXT_CHARS) return text;
    return `${text.slice(0, MAX_PDF_TEXT_CHARS)}\n\n[truncated]`;
  } catch {
    return null;
  }
}
