import { toOpenAlexHref } from "./id";
import type {
  CitationGraph,
  CitationGraphEdge,
  CitationGraphNode,
  S2Citation,
  S2Paper,
  S2Reference,
} from "./types";

function toNode(
  paper: S2Paper,
  kind: CitationGraphNode["kind"],
): CitationGraphNode {
  return {
    id: paper.paperId,
    title: paper.title,
    year: paper.year,
    citationCount: paper.citationCount,
    influentialCitationCount: paper.influentialCitationCount,
    tldr: paper.tldr,
    fieldsOfStudy: paper.fieldsOfStudy,
    doi: paper.externalIds?.DOI ?? null,
    openalexHref: toOpenAlexHref(paper),
    url: paper.url,
    kind,
  };
}

function influenceScore(paper: S2Paper): number {
  return (
    (paper.influentialCitationCount ?? 0) * 10 + (paper.citationCount ?? 0)
  );
}

// Build a 1-hop citation graph: focus paper plus the top `perSide` references
// and top `perSide` citing works, ranked by influential citation count (with
// raw citation count as a tiebreaker). Edges point from the focus to each
// reference and from each citation to the focus.
export function buildCitationGraph(
  focus: S2Paper,
  references: S2Reference[],
  citations: S2Citation[],
  perSide: number,
): CitationGraph {
  const topReferences = [...references]
    .map((r) => r.citedPaper)
    .filter((p): p is S2Paper => p != null)
    .sort((a, b) => influenceScore(b) - influenceScore(a))
    .slice(0, perSide);

  const topCitations = [...citations]
    .map((c) => c.citingPaper)
    .filter((p): p is S2Paper => p != null)
    .sort((a, b) => influenceScore(b) - influenceScore(a))
    .slice(0, perSide);

  const focusNode = toNode(focus, "focus");
  const referenceNodes = topReferences.map((p) => toNode(p, "reference"));
  const citationNodes = topCitations.map((p) => toNode(p, "citing"));

  const referenceEdges: CitationGraphEdge[] = topReferences.map((p) => ({
    from: focus.paperId,
    to: p.paperId,
    kind: "reference",
    isInfluential: false,
  }));

  // Citation edges carry the isInfluential flag from S2 so we can highlight
  // the ones S2 considers influential.
  const citationByPaperId = new Map(
    citations.map((c) => [c.citingPaper.paperId, c]),
  );
  const citationEdges: CitationGraphEdge[] = topCitations.map((p) => ({
    from: p.paperId,
    to: focus.paperId,
    kind: "citing",
    isInfluential: citationByPaperId.get(p.paperId)?.isInfluential ?? false,
  }));

  return {
    focus: focusNode,
    nodes: [...referenceNodes, ...citationNodes],
    edges: [...referenceEdges, ...citationEdges],
    referenceTotal: references.length,
    citationTotal: citations.length,
  };
}
