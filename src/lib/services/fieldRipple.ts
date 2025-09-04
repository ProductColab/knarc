import { DependencyGraph } from "@/lib/deps/graph";
import { Edge, EdgeType, NodeRef, toNodeId } from "@/lib/deps/types";
import { Subgraph } from "@/lib/deps/serialize";

export interface FieldRippleOptions {
  // Edge types to include when traversing ripple impact. Defaults exclude purely presentational edges.
  includeEdgeTypes?: EdgeType[];
  // Edge types to explicitly exclude.
  excludeEdgeTypes?: EdgeType[];
  // Max traversal depth along incoming edges. Defaults to unlimited.
  maxDepth?: number;
}

export interface FieldRippleResult extends Subgraph {
  impactedFields: NodeRef[];
  impactedViews: NodeRef[];
  impactedObjects: NodeRef[];
}

const DEFAULT_INCLUDED: EdgeType[] = [
  // Performance-relevant dependencies
  "derivesFrom", // equations, sums, concatenations
  "filtersBy", // view or source filters
  "sortsBy", // sort operations can affect performance
  "uses", // used in rules/criteria/values
];

const DEFAULT_EXCLUDED: EdgeType[] = [
  "displays", // purely presentational
  "contains", // containment does not imply recalculation
  "connectsTo", // relationships can be heavy, but exclude by default here
];

function isAllowedEdge(
  edge: Edge,
  include: EdgeType[],
  exclude: EdgeType[]
): boolean {
  if (exclude.includes(edge.type)) return false;
  if (include.length > 0 && !include.includes(edge.type)) return false;
  return true;
}

function isFieldListUses(edge: Edge): boolean {
  if (edge.type !== "uses") return false;
  const p = edge.locationPath ?? "";
  // Exclude generic field list references (e.g., columns or static field lists)
  // Keep rule-specific references like .rules.fields
  if (p.includes(".rules.fields")) return false;
  return (
    p.endsWith(".fields") || p.includes(".columns") || p.includes(".fields[")
  );
}

/**
 * Builds a ripple subgraph representing entities likely impacted when a field value changes.
 * Traverses INCOMING edges from the starting field, because dependencies are modeled as:
 *   dependent -> dependency (e.g., derivedField derivesFrom inputField), and
 *   view -> field for filters/sorts/uses.
 */
export function buildFieldRipple(
  graph: DependencyGraph,
  fieldKey: string,
  options?: FieldRippleOptions
): FieldRippleResult {
  const include = options?.includeEdgeTypes ?? DEFAULT_INCLUDED;
  const exclude = options?.excludeEdgeTypes ?? DEFAULT_EXCLUDED;
  const maxDepth = options?.maxDepth ?? Number.POSITIVE_INFINITY;

  const field = graph
    .getAllNodes()
    .find((n) => n.type === "field" && n.key === fieldKey);
  if (!field)
    return {
      nodes: [],
      edges: [],
      impactedFields: [],
      impactedViews: [],
      impactedObjects: [],
    };

  const nodesMap = new Map<string, NodeRef>([[toNodeId(field), field]]);
  const edges: Edge[] = [];

  const visited = new Set<string>([toNodeId(field)]);
  const queue: Array<{ node: NodeRef; depth: number }> = [
    { node: field, depth: 0 },
  ];

  while (queue.length) {
    const { node, depth } = queue.shift()!;
    if (depth >= maxDepth) continue;

    const incoming = graph.getIncoming(node);
    for (const e of incoming) {
      if (!isAllowedEdge(e, include, exclude)) continue;
      if (isFieldListUses(e)) continue;
      edges.push(e);
      const fromId = toNodeId(e.from);
      if (!nodesMap.has(fromId)) nodesMap.set(fromId, e.from);
      if (!visited.has(fromId)) {
        visited.add(fromId);
        queue.push({ node: e.from, depth: depth + 1 });
      }
    }
  }

  const nodes = Array.from(nodesMap.values());
  const impactedFields = nodes.filter(
    (n) => n.type === "field" && n.key !== fieldKey
  );
  const impactedViews = nodes.filter((n) => n.type === "view");
  const impactedObjects = nodes.filter((n) => n.type === "object");

  return { nodes, edges, impactedFields, impactedViews, impactedObjects };
}

/**
 * Computes simple ripple metrics for a field to support scoring or display.
 */
export function summarizeFieldRipple(result: FieldRippleResult): {
  totalImpactedNodes: number;
  totalImpactedFields: number;
  totalImpactedViews: number;
  totalImpactedObjects: number;
  edgeCount: number;
} {
  return {
    totalImpactedNodes: result.nodes.length,
    totalImpactedFields: result.impactedFields.length,
    totalImpactedViews: result.impactedViews.length,
    totalImpactedObjects: result.impactedObjects.length,
    edgeCount: result.edges.length,
  };
}
