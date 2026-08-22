import { cacheLife } from "next/cache";
import sanitize from "sanitize-html";

import { normalizeArxivId } from "./client";
import type { ArxivHtml } from "./types";

const USER_AGENT =
  process.env.ARXIV_USER_AGENT ?? "Zapron/0.1 (https://github.com/zapron)";

const HTML_BASE = "https://arxiv.org/html";

// MathML tags produced by LaTeXML. sanitize-html doesn't know about these by
// default, so we allowlist them explicitly.
const MATHML_TAGS = [
  "math",
  "semantics",
  "annotation",
  "annotation-xml",
  "mrow",
  "mi",
  "mo",
  "mn",
  "ms",
  "mtext",
  "mspace",
  "mfrac",
  "msub",
  "msup",
  "msubsup",
  "mroot",
  "msqrt",
  "mtable",
  "mtr",
  "mtd",
  "mfenced",
  "menclose",
  "mstyle",
  "mpadded",
  "mphantom",
  "munder",
  "mover",
  "munderover",
  "mglyph",
  " maligngroup",
  "malignmark",
];

// Standard HTML tags we allow in the article body. Covers everything LaTeXML
// emits inside <article>.
const ALLOWED_TAGS = sanitize.defaults.allowedTags.concat([
  "article",
  "section",
  "nav",
  "header",
  "footer",
  "figure",
  "figcaption",
  "img",
  "svg",
  "path",
  "g",
  "rect",
  "line",
  "circle",
  "ellipse",
  "polygon",
  "polyline",
  "defs",
  "use",
  "symbol",
  "text",
  "tspan",
  "clipPath",
  ...MATHML_TAGS,
]);

const ALLOWED_ATTR = [
  "class",
  "id",
  "href",
  "src",
  "alt",
  "title",
  "colspan",
  "rowspan",
  "encoding",
  "definitionURL",
  "xlink:href",
  "mathvariant",
  "stretchy",
  "fence",
  "separator",
  "form",
  "lspace",
  "rspace",
  "movablelimits",
  "accent",
  "accentunder",
  "align",
  "columnalign",
  "rowalign",
  "columnspacing",
  "rowspacing",
  "columnlines",
  "rowlines",
  "frame",
  "framespacing",
  "equalrows",
  "equalcolumns",
  "displaystyle",
  "scriptlevel",
  "notation",
  "depth",
  "height",
  "width",
  "lquote",
  "rquote",
  "bevelled",
  "notation",
  "close",
  "open",
  "separators",
  "charalign",
  "stackalign",
  "decimalpoint",
  "shift",
  "location",
  "crossout",
  "longdivstyle",
  "position",
  "side",
  "edge",
  "actiontype",
  "selection",
  "name",
  "cdgroup",
  "cd",
  "type",
  "fontsize",
  "color",
  "mathcolor",
  "mathbackground",
  "background",
  "fontfamily",
  "fontweight",
  "fontstyle",
  "asymptote",
  "data",
  "role",
  "aria-label",
  "aria-hidden",
  "viewBox",
  "preserveAspectRatio",
  "fill",
  "stroke",
  "stroke-width",
  "d",
  "transform",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "points",
  "clip-path",
  "clipPathUnits",
  "gradientUnits",
  "offset",
  "stop-color",
  "stop-opacity",
  "text-anchor",
  "dominant-baseline",
  "font-size",
  "font-style",
  "font-weight",
  "text-decoration",
  "opacity",
  "xmlns",
  "xmlns:xlink",
];

// Rewrite relative image/asset URLs to absolute arXiv URLs. LaTeXML emits
// paths like "2112.10741v3/figures/banner.png" relative to the HTML page URL
// (https://arxiv.org/html/{id}). Per URL resolution rules, the last segment of
// the base path is replaced, so these resolve to https://arxiv.org/html/{path}.
function rewriteUrls(html: string): string {
  return html.replace(
    /(<(?:img|image|use|a)\b[^>]*?(?:src|href|xlink:href)=["'])(?!https?:|\/\/|mailto:|#|data:)([^"']+)(["'])/gi,
    (_match, prefix, url, suffix) => {
      if (url.startsWith("/")) {
        return `${prefix}https://arxiv.org${url}${suffix}`;
      }
      return `${prefix}${HTML_BASE}/${url}${suffix}`;
    },
  );
}

// Extract the <article> body and the CSS <link> URL from the arXiv HTML page.
function extractArticle(html: string): {
  article: string | null;
  cssUrl: string | null;
} {
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const cssMatch = html.match(
    /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/i,
  );

  let cssUrl = cssMatch?.[1] ?? null;
  if (cssUrl?.startsWith("/")) {
    cssUrl = `https://arxiv.org${cssUrl}`;
  }

  return {
    article: articleMatch?.[1] ?? null,
    cssUrl,
  };
}

async function fetchArxivHtmlRaw(arxivId: string): Promise<ArxivHtml | null> {
  const id = normalizeArxivId(arxivId);
  const url = `${HTML_BASE}/${id}`;

  const res = await fetch(url, {
    headers: {
      Accept: "text/html",
      "User-Agent": USER_AGENT,
    },
  });

  if (!res.ok) return null;

  const html = await res.text();
  const { article, cssUrl } = extractArticle(html);
  if (!article) return null;

  // Rewrite URLs before sanitizing so sanitize-html sees absolute https://
  // URLs and keeps img/src/href attributes (it strips scheme-less attributes).
  const rewritten = rewriteUrls(article);

  const sanitized = sanitize(rewritten, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { "*": ALLOWED_ATTR },
    allowedSchemes: ["http", "https", "mailto"],
  });

  return { id, html: sanitized, cssUrl };
}

export async function getArxivHtml(arxivId: string): Promise<ArxivHtml | null> {
  "use cache";
  cacheLife("days");

  return fetchArxivHtmlRaw(arxivId);
}
