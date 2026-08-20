// OpenAlex API types. Shaped from the fields we select to keep payloads small.
// Many fields are nullable in the API; optionals reflect that.

export type WorkType =
  | "article"
  | "book-chapter"
  | "book"
  | "dataset"
  | "dissertation"
  | "editorial"
  | "erratum"
  | "letter"
  | "paratext"
  | "preprint"
  | "proceedings-article"
  | "reference-entry"
  | "report"
  | "review"
  | "standard"
  | "other";

export type OpenAccessStatus =
  | "gold"
  | "green"
  | "hybrid"
  | "bronze"
  | "closed"
  | "diamond";

export interface OpenAccess {
  is_oa: boolean;
  oa_status: OpenAccessStatus | null;
  oa_url: string | null;
  oa_version: string | null;
  any_repository_has_fulltext: boolean | null;
}

export interface Author {
  id: string | null;
  display_name: string;
  orcid: string | null;
}

export interface Institution {
  id: string | null;
  display_name: string;
  ror: string | null;
  country_code: string | null;
  type: string | null;
}

export interface Authorship {
  author_position: string | null;
  author: Author;
  institutions: Institution[];
  raw_author_name: string | null;
}

export interface DehydratedSource {
  id: string | null;
  display_name: string | null;
  issn_l: string | null;
  issn: string[] | null;
  host_type: string | null;
  is_in_doaj: boolean | null;
  publisher: string | null;
}

export interface Location {
  is_oa: boolean;
  landing_page_url: string | null;
  pdf_url: string | null;
  source: DehydratedSource | null;
  license: string | null;
  version: string | null;
}

export interface PrimaryLocation {
  is_oa: boolean | null;
  landing_page_url: string | null;
  pdf_url: string | null;
  source: DehydratedSource | null;
  license: string | null;
  version: string | null;
}

export interface Biblio {
  volume: string | null;
  issue: string | null;
  first_page: string | null;
  last_page: string | null;
}

export interface Concept {
  id: string;
  display_name: string;
  level: number;
  score: number | null;
}

export interface WorkIds {
  openalex: string;
  doi: string | null;
  pmid: string | null;
  mag: number | null;
  arxiv_id: string | null;
}

// Inverted index: word -> positions in the abstract.
export type AbstractInvertedIndex = Record<string, number[]>;

export interface Work {
  id: string;
  doi: string | null;
  display_name: string;
  title: string | null;
  publication_year: number | null;
  publication_date: string | null;
  type: WorkType | string | null;
  cited_by_count: number | null;
  is_retracted: boolean | null;
  open_access: OpenAccess | null;
  authorships: Authorship[] | null;
  primary_location: PrimaryLocation | null;
  best_oa_location: Location | null;
  locations: Location[] | null;
  biblio: Biblio | null;
  concepts: Concept[] | null;
  ids: WorkIds | null;
  abstract_inverted_index: AbstractInvertedIndex | null;
  referenced_works: string[] | null;
  related_works: string[] | null;
  abstract: string | null;
}

export interface SearchMeta {
  count: number;
  per_page: number;
  page: number | null;
  next_cursor: string | null;
}

export interface SearchResponse {
  meta: SearchMeta;
  results: Work[];
}

export type SortField =
  | "relevance_score"
  | "publication_date"
  | "cited_by_count";
export type SortDirection = "asc" | "desc";

export interface SearchParams {
  query: string;
  yearMin?: number;
  yearMax?: number;
  types?: string[];
  continents?: string[];
  countries?: string[];
  openAccessOnly?: boolean;
  sort?: SortField;
  sortDirection?: SortDirection;
  perPage?: number;
  cursor?: string;
  page?: number;
}
