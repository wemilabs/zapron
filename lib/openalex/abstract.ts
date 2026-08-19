import type { AbstractInvertedIndex } from "./types";

// OpenAlex ships abstracts as inverted indexes (word -> positions) for legal
// reasons. Reconstruct the plaintext by reversing the index.
export function reconstructAbstract(
  index: AbstractInvertedIndex | null | undefined,
): string | null {
  if (!index) return null;

  const positions: { word: string; position: number }[] = [];
  for (const [word, idxs] of Object.entries(index)) {
    for (const position of idxs) {
      positions.push({ word, position });
    }
  }

  if (positions.length === 0) return null;

  positions.sort((a, b) => a.position - b.position);
  return positions.map((p) => p.word).join(" ");
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}
