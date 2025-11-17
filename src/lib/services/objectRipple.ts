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

  console.log("[ripple:object] Building ripple for object", {
    objectKey,
    objectId: toNodeId(objectNode),
    options,
  });

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

  console.log("[ripple:object] Found direct fields", {
    fieldCount: fields.length,
    fieldKeys: fields,
  });

  for (const fk of fields) {
    if (!fk) continue;
    const fr = buildFieldRipple(graph, fk, options);
    console.log("[ripple:object] Field ripple for", fk, {
      nodesAdded: fr.nodes.length,
      edgesAdded: fr.edges.length,
      edgeTypes: Array.from(new Set(fr.edges.map((e) => e.type))),
      impactedFields: fr.impactedFields.length,
      impactedViews: fr.impactedViews.length,
      impactedObjects: fr.impactedObjects.length,
    });
    for (const n of fr.nodes) nodesMap.set(toNodeId(n), n);
    for (const e of fr.edges) edges.push(e);
  }

  const result = {
    nodes: Array.from(nodesMap.values()),
    edges,
    root: objectNode,
  };

  console.log("[ripple:object] Final ripple result", {
    totalNodes: result.nodes.length,
    totalEdges: result.edges.length,
    nodeTypes: Array.from(
      new Set(result.nodes.map((n) => n.type))
    ).reduce((acc, type) => {
      acc[type] = result.nodes.filter((n) => n.type === type).length;
      return acc;
    }, {} as Record<string, number>),
    edgeTypes: Array.from(new Set(result.edges.map((e) => e.type))).reduce(
      (acc, type) => {
        acc[type] = result.edges.filter((e) => e.type === type).length;
        return acc;
      },
      {} as Record<string, number>
    ),
    sampleEdges: result.edges.slice(0, 10).map((e) => ({
      type: e.type,
      from: `${e.from.type}:${e.from.key}`,
      to: `${e.to.type}:${e.to.key}`,
      locationPath: e.locationPath,
    })),
  });

  return result;
}
