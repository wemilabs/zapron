import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import { normalizeWorkId } from "@/lib/openalex/format";
import { getWorkDetail } from "@/lib/openalex/work";
import { buildCitationGraph } from "@/lib/semanticscholar/graph";
import {
  getS2Citations,
  getS2Paper,
  getS2References,
} from "@/lib/semanticscholar/paper";
import type {
  CitationGraph as CitationGraphData,
  CitationGraphEdge,
  CitationGraphNode,
} from "@/lib/semanticscholar/types";

const PER_SIDE_COMPACT = 10;
const PER_SIDE_FULL = 15;

interface CitationGraphProps {
  params: Promise<{ id: string }>;
  compact?: boolean;
}

export async function CitationGraph({ params, compact }: CitationGraphProps) {
  const { id } = await params;
  const workId = normalizeWorkId(id);
  const work = await getWorkDetail(workId);

  const paperResult = await getS2Paper(work);
  if (!paperResult.ok) {
    return paperResult.reason === "rate-limited" ? (
      <RateLimitedState />
    ) : (
      <NoMatchState />
    );
  }

  const paper = paperResult.paper;
  const perSide = compact ? PER_SIDE_COMPACT : PER_SIDE_FULL;
  const [referencesResult, citationsResult] = await Promise.all([
    getS2References(paper.paperId, perSide),
    getS2Citations(paper.paperId, perSide),
  ]);

  if (!referencesResult.ok || !citationsResult.ok) return <RateLimitedState />;

  const graph = buildCitationGraph(
    paper,
    referencesResult.items,
    citationsResult.items,
    perSide,
  );

  return <CitationGraphView graph={graph} compact={compact} workId={workId} />;
}

function RateLimitedState() {
  return (
    <p className="py-8 text-sm text-muted-foreground">
      Semantic Scholar is rate-limiting requests. Please try again in a moment,
      or set <code className="font-mono">SEMANTIC_SCHOLAR_API_KEY</code> for
      higher limits.
    </p>
  );
}

function NoMatchState() {
  return (
    <p className="py-8 text-sm text-muted-foreground">
      Citation graph is not available for this work. Semantic Scholar
      couldn&rsquo;t match it by DOI or arXiv id.
    </p>
  );
}

interface CitationGraphViewProps {
  graph: CitationGraphData;
  compact?: boolean;
  workId: string;
}

function CitationGraphView({ graph, compact, workId }: CitationGraphViewProps) {
  const size = compact ? 360 : 640;
  const radius = compact ? 130 : 240;
  const center = size / 2;

  const referenceNodes = graph.nodes.filter((n) => n.kind === "reference");
  const citationNodes = graph.nodes.filter((n) => n.kind === "citing");

  // References on the upper semicircle (angles from 180° to 360° in math
  // convention, i.e. the top half), citations on the lower semicircle (0° to
  // 180°). Spread evenly across each arc.
  const referencePositions = placeArc(referenceNodes, radius, center, "upper");
  const citationPositions = placeArc(citationNodes, radius, center, "lower");
  const positions = new Map<string, { x: number; y: number }>([
    ...referencePositions,
    ...citationPositions,
    [graph.focus.id, { x: center, y: center }],
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="h-auto w-full max-w-full"
          role="img"
          aria-label="Citation graph"
        >
          <title>{`Citation graph for ${graph.focus.title ?? "this work"}`}</title>
          <defs>
            <marker
              id="citing-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
            </marker>
          </defs>

          {graph.edges.map((edge) => (
            <Edge
              key={`${edge.from}-${edge.to}`}
              edge={edge}
              positions={positions}
            />
          ))}

          <FocusNode node={graph.focus} x={center} y={center} />

          {graph.nodes.map((node) => {
            const pos = positions.get(node.id);
            if (!pos) return null;
            return (
              <GraphNode
                key={node.id}
                node={node}
                x={pos.x}
                y={pos.y}
                compact={compact}
              />
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <LegendDot className="fill-primary" label="Focus paper" />
        <LegendDot className="fill-muted-foreground" label="Reference" />
        <LegendDot className="fill-muted-foreground" label="Citing work" />
        <LegendDot className="fill-amber-500" label="Influential citation" />
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Showing {referenceNodes.length} of {graph.referenceTotal} references and{" "}
        {citationNodes.length} of {graph.citationTotal} citing works.
      </p>

      {compact && (
        <div className="flex justify-center">
          <Link
            href={`/work/${encodeURIComponent(workId)}/graph`}
            prefetch
            className="text-sm font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Open full graph
          </Link>
        </div>
      )}
    </div>
  );
}

function Edge({
  edge,
  positions,
}: {
  edge: CitationGraphEdge;
  positions: Map<string, { x: number; y: number }>;
}) {
  const from = positions.get(edge.from);
  const to = positions.get(edge.to);
  if (!from || !to) return null;

  const isCiting = edge.kind === "citing";
  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      className={
        edge.isInfluential ? "stroke-amber-500" : "stroke-muted-foreground/40"
      }
      strokeWidth={edge.isInfluential ? 2 : 1}
      markerEnd={isCiting ? "url(#citing-arrow)" : undefined}
    />
  );
}

function FocusNode({
  node,
  x,
  y,
}: {
  node: CitationGraphNode;
  x: number;
  y: number;
}) {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={10}
        className="fill-primary stroke-primary-foreground"
        strokeWidth={2}
      />
      <title>{node.title ?? "Focus paper"}</title>
    </g>
  );
}

function GraphNode({
  node,
  x,
  y,
  compact,
}: {
  node: CitationGraphNode;
  x: number;
  y: number;
  compact?: boolean;
}) {
  // Node radius scales with log(1 + citationCount), clamped to [3, 9].
  const citations = node.citationCount ?? 0;
  const r = Math.max(3, Math.min(9, 3 + Math.log2(1 + citations) * 0.6));

  const label = node.title ?? "Untitled";
  const truncatedLabel = truncate(label, compact ? 28 : 40);
  const showLabel = !compact && (node.influentialCitationCount ?? 0) > 0;

  const fillClass =
    node.kind === "reference"
      ? "fill-muted-foreground"
      : "fill-muted-foreground/70";

  const content = (
    <g>
      <circle
        cx={x}
        cy={y}
        r={r}
        className={fillClass}
        stroke="hsl(var(--background))"
        strokeWidth={1}
      />
      <title>{label}</title>
      {showLabel && (
        <text
          x={x}
          y={y - r - 4}
          textAnchor="middle"
          className="fill-foreground text-[8px]"
        >
          {truncatedLabel}
        </text>
      )}
    </g>
  );

  if (node.openalexHref) {
    return (
      <a href={node.openalexHref} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return content;
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
        <circle cx="4" cy="4" r="4" className={className} />
      </svg>
      {label}
    </span>
  );
}

// Place nodes evenly along an arc. Upper arc spans the top semicircle (math
// angles 180° to 360°), lower arc spans the bottom semicircle (0° to 180°).
function placeArc(
  nodes: CitationGraphNode[],
  radius: number,
  center: number,
  half: "upper" | "lower",
): Array<[string, { x: number; y: number }]> {
  if (nodes.length === 0) return [];

  // Add padding so the first and last nodes don't sit on the horizontal axis.
  const padding = 0.15;
  const span = 1 - 2 * padding;
  const step = nodes.length > 1 ? span / (nodes.length - 1) : 0;

  return nodes.map((node, i) => {
    const t = padding + step * i;
    // upper: angles from 180° to 360° (top half); lower: 0° to 180° (bottom).
    const angleDeg = half === "upper" ? 180 + t * 180 : t * 180;
    const angle = (angleDeg * Math.PI) / 180;
    return [
      node.id,
      {
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle),
      },
    ];
  });
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}\u2026`;
}

export function CitationGraphSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4">
      <Skeleton className="aspect-square w-full max-w-md rounded-full" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}
