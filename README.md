# Zapron

A search engine for the global research record. Type a question, get papers back. Built on OpenAlex, with citation graphs and recommendations from Semantic Scholar and on-demand summaries from Grok.

## What it does

- Search OpenAlex by keyword or natural language.
- Filter by year range, work type, open access, continent, or country. Sort by relevance, publication date, or citation count.
- Open a work to read its abstract, references, and citing works.
- Get a structured AI summary streamed from Grok, with key findings, methods, significance, limitations, and future work. For arXiv papers, the summary reads the full text, not just the abstract.
- See a citation graph and recommended papers from Semantic Scholar, bridged from OpenAlex by DOI or arXiv id.
- Read arXiv papers as rendered HTML inside the page.

## How natural-language search works

When you submit a query, Grok parses it into structured OpenAlex filter params: search term, year range, work types, open access, continents, countries, and sort. The parsed result is cached for a day per query, so the same phrasing always maps to the same filters. If parsing fails, the raw query string is used as a plain search term, so you always land on a working search.
