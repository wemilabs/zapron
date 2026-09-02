import type { SummaryInput } from "@/lib/ai/types";
import { getArxivFullText } from "@/lib/arxiv/text";
import { getPdfFullText } from "@/lib/pdf/text";

// Shared between the summary generator and the Q&A chat so both resolve the
// paper's text the same way: prefer arXiv full text, then OA PDF, then
// abstract as last resort.
export async function resolveContent(
  input: SummaryInput,
): Promise<string | null> {
  if (input.arxivId) {
    const fullText = await getArxivFullText(input.arxivId);
    if (fullText) return `Full text:\n\n${fullText}`;
  }
  if (input.pdfUrl) {
    const fullText = await getPdfFullText(input.pdfUrl);
    if (fullText) return `Full text:\n\n${fullText}`;
  }
  if (input.abstractText) return `Abstract:\n\n${input.abstractText}`;
  return null;
}
