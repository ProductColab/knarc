import type { XYPosition } from "@xyflow/react";
import { DependencyGraph } from "@/lib/deps/graph";
import { Subgraph } from "@/lib/deps/serialize";
import { toNodeId } from "@/lib/deps/types";
import dagre from "@dagrejs/dagre";

export interface LayoutOptions {
  rankGap?: number;
  nodeGap?: number;
}

// Simple BFS-based radial layout from the first node as root
export function layoutBFS(
  graph: DependencyGraph,
  subgraph: Subgraph,
  options: LayoutOptions = {}
): Map<string, XYPosition> {
  const rankGap = options.rankGap ?? 120;
  const nodeGap = options.nodeGap ?? 120;
  const positions = new Map<string, XYPosition>();
  if (subgraph.nodes.length === 0) return positions;

  const root = subgraph.nodes[0];
  const levels: string[][] = [];
  const visited = new Set<string>();
  const queue: { id: string; d: number }[] = [{ id: toNodeId(root), d: 0 }];
  // Build adjacency from subgraph edges only to avoid referencing nodes not in the subgraph
  const adjacency = new Map<string, string[]>();
  for (const e of subgraph.edges) {
    const fromId = toNodeId(e.from);
    const toId = toNodeId(e.to);
    if (!adjacency.has(fromId)) adjacency.set(fromId, []);
    adjacency.get(fromId)!.push(toId);
  }
  visited.add(toNodeId(root));
  while (queue.length) {
    const { id, d } = queue.shift()!;
    if (!levels[d]) levels[d] = [];
    levels[d].push(id);
    const neighbors = adjacency.get(id) ?? [];
    for (const nid of neighbors) {
      if (!visited.has(nid)) {
        visited.add(nid);
        queue.push({ id: nid, d: d + 1 });
      }
    }
  }

  for (let r = 0; r < levels.length; r++) {
    const layer = levels[r];
    for (let i = 0; i < layer.length; i++) {
      positions.set(layer[i], { x: i * nodeGap, y: r * rankGap });
    }
  }
  // Place any disconnected nodes at the bottom
  let tail = levels.length * rankGap;
  for (const n of subgraph.nodes) {
    const id = toNodeId(n);
    if (!positions.has(id)) {
      positions.set(id, { x: 0, y: tail });
      tail += rankGap;
    }
  }
  return positions;
}

export function layoutDagre(
  subgraph: Subgraph,
  direction: "TB" | "BT" | "LR" | "RL" = "TB",
  nodeSize: { width: number; height: number } = { width: 172, height: 36 },
  spacing: { rankSep?: number; nodeSep?: number; edgeSep?: number } = {}
): Map<string, XYPosition> {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    ranksep: spacing.rankSep ?? 160,
    nodesep: spacing.nodeSep ?? 140,
    edgesep: spacing.edgeSep ?? 40,
  });
  try {
    console.log(
      "[layoutDagre] rankdir",
      direction,
      "nodes",
      subgraph.nodes.length,
      "edges",
      subgraph.edges.length
    );
  } catch {}

  for (const n of subgraph.nodes) {
    g.setNode(toNodeId(n), { width: nodeSize.width, height: nodeSize.height });
  }
  for (const e of subgraph.edges) {
    g.setEdge(toNodeId(e.from), toNodeId(e.to));
  }

  dagre.layout(g);

  const positions = new Map<string, XYPosition>();
  for (const n of subgraph.nodes) {
    const id = toNodeId(n);
    const nodeWithPos = g.node(id);
    if (!nodeWithPos) continue;
    try {
      console.log("[layoutDagre] pos", id, nodeWithPos.x, nodeWithPos.y);
    } catch {}
    positions.set(id, {
      x: nodeWithPos.x - nodeSize.width / 2,
      y: nodeWithPos.y - nodeSize.height / 2,
    });
  }
  return positions;
}
