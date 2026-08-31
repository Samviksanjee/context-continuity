/* Canonical context-graph model. Both the visual graph and the structured,
 * screen-reader/keyboard view render from this one model so the two
 * presentations can never diverge (accessibility requirement A11Y-06). */

export interface ContextGraphInput {
  key: string;
  label: string;
  nodes: string[];
  relationship: string;
  source: string;
  sourceKind: string;
  status: string;
  confidence: string;
}

export type GraphNodeKind = "context" | "entity";

export interface GraphNode {
  id: string;
  label: string;
  kind: GraphNodeKind;
}

export type EdgeDirection = "from-context" | "to-context";

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  direction: EdgeDirection;
}

export interface ContextGraphProvenance {
  source: string;
  sourceKind: string;
  status: string;
  confidence: string;
}

export interface ContextGraph {
  center: GraphNode;
  nodes: GraphNode[];
  edges: GraphEdge[];
  provenance: ContextGraphProvenance;
  relationshipSummary: string;
}

/**
 * Builds the canonical graph: a center context node, one entity node per
 * distinct label, and an edge from the context to each entity, plus the
 * provenance that every accessible presentation must expose.
 */
export function buildContextGraph(input: ContextGraphInput): ContextGraph {
  const center: GraphNode = { id: `${input.key}-center`, label: input.label, kind: "context" };
  const seen = new Set<string>();
  const nodes: GraphNode[] = [];
  input.nodes.forEach((rawLabel, index) => {
    const label = rawLabel.trim();
    const dedupeKey = label.toLowerCase();
    if (!label || seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    nodes.push({ id: `${input.key}-n${index}`, label, kind: "entity" });
  });
  const edges: GraphEdge[] = nodes.map((node, index) => ({
    id: `${input.key}-e${index}`,
    source: center.id,
    target: node.id,
    label: "includes",
    direction: "from-context",
  }));
  return {
    center,
    nodes,
    edges,
    provenance: {
      source: input.source,
      sourceKind: input.sourceKind,
      status: input.status,
      confidence: input.confidence,
    },
    relationshipSummary: input.relationship,
  };
}
