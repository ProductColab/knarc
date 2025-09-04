import { readFileSync } from "node:fs";
import { buildGraph } from "@/lib/deps/build";
import type { KnackApplication } from "@/lib/knack/types/application";
import { buildObjectRipple } from "@/lib/services/objectRipple";
import { DependencyGraph } from "@/lib/deps/graph";
import { toNodeId } from "@/lib/deps/types";

function loadSchema(path: string): KnackApplication {
  const json = JSON.parse(readFileSync(path, "utf-8"));
  return json.application as KnackApplication;
}

const schemaPath = process.argv[2] ?? "./schema.json";
const objectKey = process.argv[3] ?? "object_4";

const app = loadSchema(schemaPath);
const fullGraph = buildGraph(app);
const ripple = buildObjectRipple(fullGraph, objectKey, {
  excludeEdgeTypes: ["displays", "contains"],
  maxDepth: Number.POSITIVE_INFINITY,
});

// Build a local graph to analyze just the ripple
const g = new DependencyGraph();
for (const e of ripple.edges) g.addEdge(e);

// Node/edge counts by type
const nodesByType: Record<string, number> = {};
for (const n of ripple.nodes)
  nodesByType[n.type] = (nodesByType[n.type] ?? 0) + 1;
const edgesByType: Record<string, number> = {};
for (const e of ripple.edges)
  edgesByType[e.type] = (edgesByType[e.type] ?? 0) + 1;

// SCCs on derivesFrom to detect formula cycles
const scc = g
  .stronglyConnectedComponents(["derivesFrom"])
  .map((comp) => comp.map((n) => toNodeId(n)))
  .filter((comp) => comp.length > 1);

// DerivesFrom layering: simple DP for longest-path depth
const order = g.topologicalSort(["derivesFrom"]);
const depth = new Map<string, number>();
for (const n of order) depth.set(toNodeId(n), 0);
for (const n of order) {
  const d = depth.get(toNodeId(n)) ?? 0;
  for (const e of g.getOutgoing(n).filter((e) => e.type === "derivesFrom")) {
    const nextId = toNodeId(e.to);
    depth.set(nextId, Math.max(depth.get(nextId) ?? 0, d + 1));
  }
}
const layers: Record<number, string[]> = {};
for (const n of ripple.nodes) {
  const d = depth.get(toNodeId(n)) ?? 0;
  if (!layers[d]) layers[d] = [];
  layers[d].push(toNodeId(n));
}

// Summaries
const layerSizes = Object.values(layers).map((arr) => arr.length);
const maxLayerSize = layerSizes.length ? Math.max(...layerSizes) : 0;
const numLayers = Object.keys(layers).length;

console.log("Object ripple analysis:");
console.log("object:", objectKey);
console.log("nodes:", ripple.nodes.length, nodesByType);
console.log("edges:", ripple.edges.length, edgesByType);
console.log("scc (derivesFrom cycles):", scc);
console.log("layers (derivesFrom):", { numLayers, maxLayerSize });

// Heuristics hints
const manyViews = (nodesByType["view"] ?? 0) > 0;
const viewsToFields = ripple.edges.filter(
  (e) => e.type === "filtersBy" || e.type === "sortsBy"
).length;
const heavyViews = manyViews && viewsToFields > ripple.nodes.length * 0.5;
const skewedLayering = maxLayerSize > Math.max(6, ripple.nodes.length * 0.15);

console.log("suggestions:");
console.log("- primary_axis: derivesFrom");
if (manyViews) console.log("- place_views_in_band: true");
if (heavyViews) console.log("- collapse_dense_view_edges: true");
if (skewedLayering) console.log("- rebalance_longest_layer: true");
console.log("- object_left_fields_right_views_above_below: true");
