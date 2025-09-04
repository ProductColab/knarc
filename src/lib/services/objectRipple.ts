import { DependencyGraph } from "@/lib/deps/graph";
import { Edge, NodeRef, toNodeId } from "@/lib/deps/types";
import { Subgraph } from "@/lib/deps/serialize";
import {
  buildFieldRipple,
  FieldRippleOptions,
} from "@/lib/services/fieldRipple";

export interface ObjectRippleResult extends Subgraph {
  root: NodeRef;
}

export function buildObjectRipple(
  graph: DependencyGraph,
  objectKey: string,
  options?: FieldRippleOptions
): ObjectRippleResult {
  const objectNode = graph
    .getAllNodes()
    .find((n) => n.type === "object" && n.key === objectKey);
  if (!objectNode)
    return { nodes: [], edges: [], root: { type: "object", key: objectKey } };

  const nodesMap = new Map<string, NodeRef>([
    [toNodeId(objectNode), objectNode],
  ]);
  const edges: Edge[] = [];

  // Include object->field containment edges and gather field ripples
  const fields = graph
    .getOutgoing(objectNode)
    .filter((e) => e.type === "contains" && e.to.type === "field")
    .map((e) => {
      edges.push(e);
      nodesMap.set(toNodeId(e.to), e.to);
      return e.to.key;
    });

  for (const fk of fields) {
    if (!fk) continue;
    const fr = buildFieldRipple(graph, fk, options);
    for (const n of fr.nodes) nodesMap.set(toNodeId(n), n);
    for (const e of fr.edges) edges.push(e);
  }

  return { nodes: Array.from(nodesMap.values()), edges, root: objectNode };
}
