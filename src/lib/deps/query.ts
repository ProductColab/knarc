import { DependencyGraph } from "./graph";
import { NodeRef, toNodeId } from "./types";

export function whereUsed(graph: DependencyGraph, node: NodeRef) {
  return graph.getIncoming(node);
}

export function impact(graph: DependencyGraph, node: NodeRef) {
  return graph.bfs(node, "out");
}

export function dependsOn(graph: DependencyGraph, node: NodeRef) {
  return graph.bfs(node, "in");
}

export function pathsTo(
  graph: DependencyGraph,
  from: NodeRef,
  to: NodeRef,
  maxDepth = 6
) {
  const queue: Array<{ node: NodeRef; depth: number }> = [
    { node: from, depth: 0 },
  ];
  const parent = new Map<string, string | null>();
  parent.set(toNodeId(from), null);
  let found = false;
  while (queue.length && !found) {
    const { node: n, depth } = queue.shift()!;
    if (depth >= maxDepth) continue;
    const edges = graph.getOutgoing(n);
    for (const e of edges) {
      const id = toNodeId(e.to);
      if (!parent.has(id)) {
        parent.set(id, toNodeId(n));
        queue.push({ node: e.to, depth: depth + 1 });
        if (id === toNodeId(to)) {
          found = true;
          break;
        }
      }
    }
  }
  if (!found) return [] as NodeRef[][];
  const path: NodeRef[] = [];
  let cur: string | null = toNodeId(to);
  while (cur) {
    const node = graph.getNode(cur)!;
    path.push(node);
    cur = parent.get(cur) ?? null;
  }
  return [path.reverse()];
}
