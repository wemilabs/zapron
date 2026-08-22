// Parsed shape of an arXiv Atom entry. Only the fields we use.

export interface ArxivLink {
  href: string;
  rel: string;
  type: string | null;
  title: string | null;
}

export interface ArxivPaper {
  // Bare arXiv id (e.g. "1706.03762"), without version suffix.
  id: string;
  // Absolute abs page URL (e.g. "https://arxiv.org/abs/1706.03762v7").
  absUrl: string;
  // Absolute PDF URL when present.
  pdfUrl: string | null;
  title: string;
  summary: string;
  authors: string[];
  // Primary category term (e.g. "cs.CL") plus all listed categories.
  primaryCategory: string | null;
  categories: string[];
  comment: string | null;
  published: string | null;
  updated: string | null;
}

// Sanitized HTML rendering of an arXiv paper, ready for dangerouslySetInnerHTML.
export interface ArxivHtml {
  // Bare arXiv id (e.g. "1706.03762").
  id: string;
  // Sanitized article HTML with absolute image URLs.
  html: string;
  // arXiv stylesheet URL extracted from the page head, for <link> hoisting.
  cssUrl: string | null;
}
