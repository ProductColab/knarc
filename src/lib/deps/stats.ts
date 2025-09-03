import { DependencyGraph } from "./graph";

export interface GraphStats {
  nodeCount: number;
  edgeCount: number;
  nodesByType: Record<string, number>;
  topReferencedFields: Array<{ fieldKey: string; references: number }>;
}

export function computeStats(graph: DependencyGraph, topN = 10): GraphStats {
  const nodeCount = graph.getAllNodes().length;
  const edgeCount = graph.getAllEdges().length;
  const nodesByType: Record<string, number> = {};
  for (const n of graph.getAllNodes()) {
    nodesByType[n.type] = (nodesByType[n.type] ?? 0) + 1;
  }
  // Field incoming reference counts
  const fieldRefCounts: Record<string, number> = {};
  for (const n of graph.getAllNodes()) {
    if (n.type !== "field") continue;
    const count = graph.getIncoming(n).length;
    fieldRefCounts[n.key] = count;
  }
  const topReferencedFields = Object.entries(fieldRefCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([fieldKey, references]) => ({ fieldKey, references }));
  return { nodeCount, edgeCount, nodesByType, topReferencedFields };
}
