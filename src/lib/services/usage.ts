import { DependencyGraph } from "@/lib/deps/graph";
import { Edge, NodeRef, toNodeId } from "@/lib/deps/types";
import { Subgraph } from "@/lib/deps/serialize";

export interface UsageGroup {
  node: NodeRef;
  edges: Edge[];
}

export interface FieldUsage {
  byFields: UsageGroup[];
  byViews: UsageGroup[];
}

export function analyzeFieldUsage(
  graph: DependencyGraph,
  fieldKey: string
): FieldUsage {
  const fieldNode = graph
    .getAllNodes()
    .find((n) => n.type === "field" && n.key === fieldKey);
  if (!fieldNode) return { byFields: [], byViews: [] };
  const incoming = graph.getIncoming(fieldNode);

  const byFieldsMap = new Map<string, UsageGroup>();
  const byViewsMap = new Map<string, UsageGroup>();

  for (const e of incoming) {
    if (e.from.type === "field") {
      const id = toNodeId(e.from);
      if (!byFieldsMap.has(id))
        byFieldsMap.set(id, { node: e.from, edges: [] });
      byFieldsMap.get(id)!.edges.push(e);
    } else if (e.from.type === "view") {
      const id = toNodeId(e.from);
      if (!byViewsMap.has(id)) byViewsMap.set(id, { node: e.from, edges: [] });
      byViewsMap.get(id)!.edges.push(e);
    }
  }

  const byFields = Array.from(byFieldsMap.values()).sort(
    (a, b) => b.edges.length - a.edges.length
  );
  const byViews = Array.from(byViewsMap.values()).sort(
    (a, b) => b.edges.length - a.edges.length
  );

  return { byFields, byViews };
}

export function buildUsageSubgraph(
  graph: DependencyGraph,
  fieldKey: string
): Subgraph {
  const fieldNode = graph
    .getAllNodes()
    .find((n) => n.type === "field" && n.key === fieldKey);
  if (!fieldNode) return { nodes: [], edges: [] };
  const incoming = graph.getIncoming(fieldNode);
  const edges = incoming.filter(
    (e) => e.from.type === "field" || e.from.type === "view"
  );
  const nodesSet = new Map<string, NodeRef>();
  nodesSet.set(toNodeId(fieldNode), fieldNode);
  for (const e of edges) nodesSet.set(toNodeId(e.from), e.from);
  return { nodes: Array.from(nodesSet.values()), edges };
}

export function buildNeighborhoodSubgraph(
  graph: DependencyGraph,
  root: NodeRef,
  direction: "in" | "out" | "both" = "in",
  options?: { peerDepth?: number }
): Subgraph {
  const nodesSet = new Map<string, NodeRef>();
  const edges: Edge[] = [];
  const rootId = toNodeId(root);
  const foundRoot =
    graph.getNode(rootId) ??
    graph.getAllNodes().find((n) => toNodeId(n) === rootId);
  if (!foundRoot) return { nodes: [], edges: [] };
  nodesSet.set(rootId, foundRoot);

  const maxDepth = options?.peerDepth ?? 1;
  const visited = new Set<string>([rootId]);
  const queue: Array<{ node: NodeRef; depth: number }> = [
    {
      node: foundRoot,
      depth: 0,
    },
  ];
  while (queue.length) {
    const { node, depth } = queue.shift()!;
    if (depth >= maxDepth) continue;
    if (direction === "in" || direction === "both") {
      const incoming = graph.getIncoming(node);
      for (const e of incoming) {
        edges.push(e);
        const nid = toNodeId(e.from);
        if (!nodesSet.has(nid)) nodesSet.set(nid, e.from);
        if (!visited.has(nid)) {
          visited.add(nid);
          queue.push({ node: e.from, depth: depth + 1 });
        }
      }
    }
    if (direction === "out" || direction === "both") {
      const outgoing = graph.getOutgoing(node);
      for (const e of outgoing) {
        edges.push(e);
        const nid = toNodeId(e.to);
        if (!nodesSet.has(nid)) nodesSet.set(nid, e.to);
        if (!visited.has(nid)) {
          visited.add(nid);
          queue.push({ node: e.to, depth: depth + 1 });
        }
      }
    }
  }
  return { nodes: Array.from(nodesSet.values()), edges };
}
