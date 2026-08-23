<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Zapron

## Required env

- `OPENALEX_API_KEY` (in `.env.local`) — required to fetch from OpenAlex. Create a free account at <https://openalex.org/settings/api>. The polite pool / `mailto` is deprecated and ignored; a key is mandatory.
- `SEMANTIC_SCHOLAR_API_KEY` (in `.env.local`) — optional. Without it the Semantic Scholar Graph API allows 1 req/sec; with it ~100 req/sec. Create one at <https://www.semanticscholar.org/product/api#api-key>. Sent as the `x-api-key` header.
- `XAI_API_KEY` (in `.env.local`) — required for AI summaries. Create one at <https://x.ai/api>. Used by `@ai-sdk/xai` (Grok) to generate on-demand summaries on the work detail page; the key never reaches the client.

## Commands

- `pnpm dev` — dev server (Turbopack)
- `pnpm build` — production build
- `pnpm start` — run the production build
- `pnpm lint` — Biome check
- `pnpm format` — Biome format

## Stack notes

- Next.js 16.3 with `cacheComponents: true` and `partialPrefetching: true`. Routes must be prerenderable; push `searchParams`/`params` reads into `<Suspense>`-wrapped children. See `node_modules/next/dist/docs/`.
- shadcn v4 with `--base base` (Base UI / `@base-ui/react`).
- OpenAlex data layer is server-only (`lib/openalex/`); the API key never reaches the client.
- Semantic Scholar data layer is server-only (`lib/semanticscholar/`); the API key never reaches the client. The citation graph and recommendations views bridge from an OpenAlex work to an S2 paper via DOI or arXiv id.
