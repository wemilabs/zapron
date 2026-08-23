// Semantic Scholar Academic Graph API types. Shaped from the fields we select
// to keep payloads small. Many fields are nullable in the API; optionals
// reflect that.

export interface S2Author {
  authorId: string | null;
  name: string;
}

export interface S2ExternalIds {
  DOI?: string | null;
  ArXiv?: string | null;
  PubMed?: string | null;
  CorpusId?: number | null;
  MAG?: string | null;
  ACL?: string | null;
  PMCID?: string | null;
}

export interface S2OpenAccessPdf {
  url: string | null;
  status: string | null;
}

export interface S2Tldr {
  text: string;
  model: string;
}

export interface S2Paper {
  paperId: string;
  title: string | null;
  abstract: string | null;
  year: number | null;
  venue: string | null;
  authors: S2Author[] | null;
  citationCount: number | null;
  influentialCitationCount: number | null;
  referenceCount: number | null;
  isOpenAccess: boolean | null;
  openAccessPdf: S2OpenAccessPdf | null;
  fieldsOfStudy: string[] | null;
  tldr: S2Tldr | null;
  externalIds: S2ExternalIds | null;
  url: string | null;
}

// The references endpoint wraps each cited paper in {citedPaper, contexts, intents}.
export interface S2Reference {
  citedPaper: S2Paper;
  contexts: string[] | null;
  intents: string[] | null;
  isInfluential: boolean | null;
}

// The citations endpoint wraps each citing paper in {citingPaper, contexts, intents}.
export interface S2Citation {
  citingPaper: S2Paper;
  contexts: string[] | null;
  intents: string[] | null;
  isInfluential: boolean | null;
}

export interface S2ReferencesResponse {
  data: S2Reference[];
}

export interface S2CitationsResponse {
  data: S2Citation[];
}

export interface S2RecommendationsResponse {
  recommendedPapers: S2Paper[];
}

export type CitationGraphNodeKind = "focus" | "reference" | "citing";

export interface CitationGraphNode {
  id: string;
  title: string | null;
  year: number | null;
  citationCount: number | null;
  influentialCitationCount: number | null;
  tldr: S2Tldr | null;
  fieldsOfStudy: string[] | null;
  doi: string | null;
  openalexHref: string | null;
  url: string | null;
  kind: CitationGraphNodeKind;
}

export type CitationGraphEdgeKind = "reference" | "citing";

export interface CitationGraphEdge {
  from: string;
  to: string;
  kind: CitationGraphEdgeKind;
  isInfluential: boolean;
}

export interface CitationGraph {
  focus: CitationGraphNode;
  nodes: CitationGraphNode[];
  edges: CitationGraphEdge[];
  referenceTotal: number;
  citationTotal: number;
}
