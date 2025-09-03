import { KnackApplication } from "@/lib/knack/types/application";
import { DependencyGraph } from "./graph";
import { extractFromObject } from "./extractors/objects";
import { extractFromScene, extractFromView } from "./extractors/views";
import { toNodeId } from "./types";

export function buildGraph(app: KnackApplication): DependencyGraph {
  const graph = new DependencyGraph();
  // Objects
  for (let oi = 0; oi < app.objects.length; oi++) {
    const object = app.objects[oi];
    const objectEdges = extractFromObject(object, oi);
    for (const e of objectEdges) graph.addEdge(e);
  }
  // Scenes and Views
  for (let si = 0; si < app.scenes.length; si++) {
    const scene = app.scenes[si];
    const sceneEdges = extractFromScene(scene, si);
    for (const e of sceneEdges) graph.addEdge(e);
    for (let vi = 0; vi < scene.views.length; vi++) {
      const v = scene.views[vi];
      const viewEdges = extractFromView(v, si, vi);
      for (const e of viewEdges) graph.addEdge(e);
    }
  }
  return graph;
}

export function whereUsed(graph: DependencyGraph, nodeId: string) {
  // Return incoming edges grouped by type
  const node = graph.getNode(nodeId);
  if (!node) return { nodeId, incoming: [] };
  const incoming = graph.getIncoming(node);
  return { nodeId, incoming };
}

export function impact(graph: DependencyGraph, nodeId: string) {
  const node = graph.getNode(nodeId);
  if (!node) return { nodeId, impacted: [] };
  const impacted = graph.bfs(node, "out");
  return { nodeId, impacted: impacted.map(toNodeId) };
}
