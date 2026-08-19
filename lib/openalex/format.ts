import { reconstructAbstract } from "./abstract";
import type { Authorship, Work } from "./types";

export function formatAuthors(authorships: Authorship[] | null): string {
  if (!authorships || authorships.length === 0) return "Unknown";
  const names = authorships.map((a) => a.author.display_name);
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 3).join(", ")}, +${names.length - 3}`;
}

export function formatVenue(work: Work): string | null {
  const source = work.primary_location?.source;
  if (!source?.display_name) return null;
  return source.display_name;
}

export function formatYear(work: Work): string | null {
  if (!work.publication_year) return null;
  return String(work.publication_year);
}

export function getCitation(work: Work): string {
  const parts = [
    formatVenue(work),
    work.biblio?.volume,
    work.biblio?.issue ? `(${work.biblio.issue})` : null,
    work.biblio?.first_page ? `:${work.biblio.first_page}` : null,
  ].filter(Boolean);
  return parts.join(" ").trim() || "—";
}

export function getAbstract(work: Work): string | null {
  return reconstructAbstract(work.abstract_inverted_index);
}

export function getOpenAccessUrl(work: Work): string | null {
  return (
    work.best_oa_location?.pdf_url ??
    work.best_oa_location?.landing_page_url ??
    work.primary_location?.pdf_url ??
    work.primary_location?.landing_page_url ??
    work.open_access?.oa_url ??
    null
  );
}

export function getDoiUrl(work: Work): string | null {
  if (!work.doi) return null;
  return work.doi.startsWith("http") ? work.doi : `https://doi.org/${work.doi}`;
}

// Extract the OpenAlex ID key (e.g. "W2741809807") from a full URL or accept
// the key directly.
export function normalizeWorkId(id: string): string {
  const match = id.match(/W\d+$/i);
  return match ? match[0] : id;
}
