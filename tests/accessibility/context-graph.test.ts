import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { buildContextGraph } from "../../client/src/lib/contextGraph";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const home = readFileSync(resolve(repoRoot, "client/src/pages/Home.tsx"), "utf8");

const sample = {
  key: "work-review",
  label: "Tomorrow's client review",
  nodes: ["Calendar", "Slides", "Aisha", "Finance", "Client", "Aisha"],
  relationship: "Aisha → budget slide",
  source: "Q2_client_review.pptx",
  sourceKind: "DOCUMENT",
  status: "ACTIVE THREAD",
  confidence: "94%",
};

// A11Y-06 — the visual graph and structured view derive from one canonical model.
describe("A11Y-06 canonical context graph model", () => {
  const graph = buildContextGraph(sample);

  it("keeps the context as the center node", () => {
    expect(graph.center.label).toBe(sample.label);
    expect(graph.center.kind).toBe("context");
  });

  it("represents every distinct visual node in the structured model", () => {
    const distinct = Array.from(new Set(sample.nodes.map((label) => label.toLowerCase())));
    expect(graph.nodes).toHaveLength(distinct.length);
    for (const label of sample.nodes) {
      expect(graph.nodes.some((node) => node.label === label)).toBe(true);
    }
  });

  it("connects every entity node to the center with a valid edge", () => {
    expect(graph.edges).toHaveLength(graph.nodes.length);
    const nodeIds = new Set(graph.nodes.map((node) => node.id));
    for (const edge of graph.edges) {
      expect(edge.source).toBe(graph.center.id);
      expect(nodeIds.has(edge.target)).toBe(true);
    }
  });

  it("carries provenance and the relationship summary", () => {
    expect(graph.provenance.source).toBe(sample.source);
    expect(graph.provenance.status).toBe(sample.status);
    expect(graph.provenance.confidence).toBe(sample.confidence);
    expect(graph.relationshipSummary).toBe(sample.relationship);
  });

  it("uses unique node ids", () => {
    const ids = graph.nodes.map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// A11Y-06 — the structured view is rendered and the visual scene is decorative.
describe("A11Y-06 structured view and decorative visual scene", () => {
  it("renders a structured relationships view from the model", () => {
    expect(home).toContain("buildContextGraph");
    expect(home).toContain('className="graph-structured"');
    expect(home).toContain("RELATIONSHIPS · STRUCTURED VIEW");
  });

  it("makes the visual scene non-focusable and hidden from assistive tech", () => {
    expect(home).toMatch(/graph-scene"\s+aria-hidden="true"/);
    expect(home).toContain("tabIndex={-1}");
  });
});
