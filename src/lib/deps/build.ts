import { KnackApplication } from "@/lib/knack/types/application";
import { DependencyGraph } from "./graph";
import { extractFromObject } from "./extractors/objects";
import { extractFromScene, extractFromView } from "./extractors/views";
import { buildResolvers } from "./resolvers";
import { KnackScene } from "../knack/types/scene";

function addObjectEdges(
  graph: DependencyGraph,
  app: KnackApplication,
  resolvers: ReturnType<typeof buildResolvers>
) {
  for (let objectIndex = 0; objectIndex < app.objects.length; objectIndex++) {
    const object = app.objects[objectIndex];
    const edges = extractFromObject(object, objectIndex, resolvers);
    for (const edge of edges) {
      graph.addEdge(edge);
    }
  }
}

function addSceneAndViewEdges(
  graph: DependencyGraph,
  app: KnackApplication,
  resolvers: ReturnType<typeof buildResolvers>
) {
  for (let sceneIndex = 0; sceneIndex < app.scenes.length; sceneIndex++) {
    const scene = app.scenes[sceneIndex];
    const sceneEdges = extractFromScene(scene, sceneIndex);
    for (const edge of sceneEdges) {
      graph.addEdge(edge);
    }
    addViewEdges(graph, scene, sceneIndex, resolvers);
  }
}

function addViewEdges(
  graph: DependencyGraph,
  scene: KnackScene,
  sceneIndex: number,
  resolvers: ReturnType<typeof buildResolvers>
) {
  for (let viewIndex = 0; viewIndex < scene.views.length; viewIndex++) {
    const view = scene.views[viewIndex];
    const viewEdges = extractFromView(view, sceneIndex, viewIndex, resolvers);
    for (const edge of viewEdges) {
      graph.addEdge(edge);
    }
  }
}

export function buildGraph(app: KnackApplication): DependencyGraph {
  const graph = new DependencyGraph();
  const resolvers = buildResolvers(app);
  addObjectEdges(graph, app, resolvers);
  addSceneAndViewEdges(graph, app, resolvers);
  return graph;
}
