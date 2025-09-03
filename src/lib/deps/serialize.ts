import { DependencyGraph } from "./graph";
import { Edge, NodeRef, toNodeId } from "./types";

export interface Subgraph {
  nodes: NodeRef[];
  edges: Edge[];
}

export function buildSubgraph(
  graph: DependencyGraph,
  roots: NodeRef[],
  direction: "out" | "in" | "both" = "both"
): Subgraph {
  const nodeSet = new Set<string>();
  const edgeList: Edge[] = [];
  function addNode(n: NodeRef) {
    const id = toNodeId(n);
    if (!nodeSet.has(id)) nodeSet.add(id);
  }
  for (const r of roots) addNode(r);
  const visitDir = (root: NodeRef, dir: "out" | "in") => {
    const nodes = graph.bfs(root, dir);
    for (const n of nodes) addNode(n);
    for (const n of nodes) {
      const edges = dir === "out" ? graph.getOutgoing(n) : graph.getIncoming(n);
      for (const e of edges) edgeList.push(e);
    }
  };
  if (direction === "out" || direction === "both") {
    for (const r of roots) visitDir(r, "out");
  }
  if (direction === "in" || direction === "both") {
    for (const r of roots) visitDir(r, "in");
  }
  const nodes = Array.from(nodeSet)
    .map((id) => graph.getNode(id)!)
    .filter(Boolean);
  return { nodes, edges: edgeList };
}
