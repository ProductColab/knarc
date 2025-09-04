import type {
  Node as FlowNode,
  ReactFlowInstance,
  XYPosition,
} from "@xyflow/react";
import { DependencyGraph } from "@/lib/deps/graph";
import { Subgraph } from "@/lib/deps/serialize";
import { toNodeId } from "@/lib/deps/types";
import dagre from "@dagrejs/dagre";
import type { NodeRef } from "@/lib/deps/types";
import { computeComplexity } from "@/lib/services/complexity";

// Configuration constants
const DEFAULT_CONFIG = {
  RANK_GAP: 120,
  NODE_GAP: 120,
  DAGRE_RANK_SEP: 160,
  DAGRE_NODE_SEP: 140,
  DAGRE_EDGE_SEP: 40,
  DEFAULT_NODE_WIDTH: 172,
  DEFAULT_NODE_HEIGHT: 36,
  RIPPLE_RANK_SEP: 220,
  RIPPLE_NODE_SEP: 180,
  RIPPLE_BAND_SEP: 140,
  VIEW_SPACING_FACTOR: 0.8,
  CENTER_OFFSET_X: 110,
  CENTER_OFFSET_Y: 24,
  MIN_SHIFT_THRESHOLD: 80,
} as const;

/**
 * Options for controlling layout spacing.
 */
export interface LayoutOptions {
  rankGap?: number; // vertical/horizontal gap between ranks/layers
  nodeGap?: number; // gap between nodes in the same layer
}

/**
 * Configuration for Dagre layout spacing.
 */
export interface DagreSpacing {
  rankSep?: number;
  nodeSep?: number;
  edgeSep?: number;
}

/**
 * Configuration for Ripple layout spacing.
 */
export interface RippleSpacing {
  rankSep?: number;
  nodeSep?: number;
  bandSep?: number;
}

/**
 * Node size configuration.
 */
export interface NodeSize {
  width: number;
  height: number;
}

/**
 * Layout direction types.
 */
export type LayoutDirection = "TB" | "BT" | "LR" | "RL";

/**
 * Cache for complexity scores to avoid recomputation.
 */
class ComplexityCache {
  private cache = new Map<string, number>();

  getScore(graph: DependencyGraph, node: NodeRef, nodeId: string): number {
    if (this.cache.has(nodeId)) {
      return this.cache.get(nodeId)!;
    }

    try {
      const score = computeComplexity(graph, node).score ?? 0;
      this.cache.set(nodeId, score);
      return score;
    } catch (error) {
      console.warn(`Failed to compute complexity for node ${nodeId}:`, error);
      this.cache.set(nodeId, 0);
      return 0;
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Utility class for node ID operations.
 */
class NodeIdUtils {
  static getId(node: NodeRef): string {
    return `${node.type}:${node.key}`;
  }

  static createNodeMap(nodes: NodeRef[]): Map<string, NodeRef> {
    const nodeById = new Map<string, NodeRef>();
    for (const node of nodes) {
      nodeById.set(NodeIdUtils.getId(node), node);
    }
    return nodeById;
  }
}

/**
 * Helper class for positioning nodes in layers.
 */
class LayerPositioner {
  static positionNodesInLayer(
    nodeIds: string[],
    layer: number,
    rankSep: number,
    nodeSep: number,
    isHorizontal: boolean,
    yOffset: number = 0,
    spacingFactor: number = 1
  ): Map<string, XYPosition> {
    const positions = new Map<string, XYPosition>();
    const baseX = isHorizontal ? layer * rankSep : 0;
    const baseY = isHorizontal ? yOffset : layer * rankSep + yOffset;
    const half = (nodeIds.length - 1) / 2;

    for (let i = 0; i < nodeIds.length; i++) {
      const offset = (i - half) * (nodeSep * spacingFactor);
      const x = isHorizontal ? baseX : baseY + offset;
      const y = isHorizontal ? baseY + offset : baseY;
      positions.set(nodeIds[i], { x, y });
    }

    return positions;
  }

  static centerLayerVertically(
    nodeIds: string[],
    baseX: number,
    baseY: number,
    nodeSep: number,
    isHorizontal: boolean
  ): Map<string, XYPosition> {
    const positions = new Map<string, XYPosition>();
    const half = (nodeIds.length - 1) / 2;

    for (let i = 0; i < nodeIds.length; i++) {
      const offset = (i - half) * nodeSep;
      const x = isHorizontal ? baseX : baseY + offset;
      const y = isHorizontal ? offset : baseY;
      positions.set(nodeIds[i], { x, y });
    }

    return positions;
  }
}

/**
 * Adjacency list builder for graph structures.
 */
export function buildAdjacencyList(subgraph: Subgraph): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();

  for (const edge of subgraph.edges) {
    const fromId = toNodeId(edge.from);
    const toId = toNodeId(edge.to);

    if (!adjacency.has(fromId)) {
      adjacency.set(fromId, []);
    }
    adjacency.get(fromId)!.push(toId);
  }

  return adjacency;
}

/**
 * Returns a map of nodeId to XYPosition using a simple BFS "radial" layout.
 * The first node in subgraph.nodes is used as the root.
 * Disconnected nodes are placed at the bottom.
 */
export function computeBFSRadialLayout(
  graph: DependencyGraph,
  subgraph: Subgraph,
  options: LayoutOptions = {}
): Map<string, XYPosition> {
  const rankGap = options.rankGap ?? DEFAULT_CONFIG.RANK_GAP;
  const nodeGap = options.nodeGap ?? DEFAULT_CONFIG.NODE_GAP;
  const positions = new Map<string, XYPosition>();

  if (subgraph.nodes.length === 0) {
    return positions;
  }

  const root = subgraph.nodes[0];
  const rootId = toNodeId(root);
  const adjacency = buildAdjacencyList(subgraph);

  // BFS traversal to assign levels
  const levels = performBFSLeveling(rootId, adjacency);

  // Assign positions for each level
  assignLevelPositions(levels, positions, nodeGap, rankGap);

  // Place disconnected nodes
  placeDisconnectedNodes(
    subgraph.nodes,
    positions,
    levels.length * rankGap,
    rankGap
  );

  return positions;
}

/**
 * Performs BFS traversal and returns nodes organized by levels.
 */
function performBFSLeveling(
  rootId: string,
  adjacency: Map<string, string[]>
): string[][] {
  const levels: string[][] = [];
  const visited = new Set<string>([rootId]);
  const queue: Array<{ id: string; depth: number }> = [
    { id: rootId, depth: 0 },
  ];

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;

    if (!levels[depth]) {
      levels[depth] = [];
    }
    levels[depth].push(id);

    const neighbors = adjacency.get(id) ?? [];
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push({ id: neighborId, depth: depth + 1 });
      }
    }
  }

  return levels;
}

/**
 * Assigns positions to nodes in each level.
 */
function assignLevelPositions(
  levels: string[][],
  positions: Map<string, XYPosition>,
  nodeGap: number,
  rankGap: number
): void {
  for (let depth = 0; depth < levels.length; depth++) {
    const layer = levels[depth];
    for (let i = 0; i < layer.length; i++) {
      positions.set(layer[i], {
        x: i * nodeGap,
        y: depth * rankGap,
      });
    }
  }
}

/**
 * Places any disconnected nodes at the bottom.
 */
function placeDisconnectedNodes(
  nodes: NodeRef[],
  positions: Map<string, XYPosition>,
  startY: number,
  rankGap: number
): void {
  let tailY = startY;

  for (const node of nodes) {
    const id = toNodeId(node);
    if (!positions.has(id)) {
      positions.set(id, { x: 0, y: tailY });
      tailY += rankGap;
    }
  }
}

/**
 * Compute node positions using dagre for a Subgraph.
 */
export function computeDagreLayoutForSubgraph(
  subgraph: Subgraph,
  direction: LayoutDirection = "TB",
  nodeSize: NodeSize = {
    width: DEFAULT_CONFIG.DEFAULT_NODE_WIDTH,
    height: DEFAULT_CONFIG.DEFAULT_NODE_HEIGHT,
  },
  spacing: DagreSpacing = {}
): Map<string, XYPosition> {
  const nodeIds = subgraph.nodes.map(toNodeId);
  const edges = subgraph.edges.map((edge) => ({
    source: toNodeId(edge.from),
    target: toNodeId(edge.to),
  }));

  return computeDagreLayout(nodeIds, edges, direction, nodeSize, spacing);
}

/**
 * Compute node positions using dagre for arbitrary node ids and edges.
 */
export function computeDagreLayout(
  nodeIds: string[],
  edges: Array<{ source: string; target: string }>,
  direction: LayoutDirection = "TB",
  nodeSize: NodeSize = {
    width: DEFAULT_CONFIG.DEFAULT_NODE_WIDTH,
    height: DEFAULT_CONFIG.DEFAULT_NODE_HEIGHT,
  },
  spacing: DagreSpacing = {}
): Map<string, XYPosition> {
  const graph = createDagreGraph(direction, spacing);

  // Add nodes
  for (const id of nodeIds) {
    graph.setNode(id, { width: nodeSize.width, height: nodeSize.height });
  }

  // Add edges
  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target);
  }

  dagre.layout(graph);

  return extractDagrePositions(graph, nodeIds, nodeSize);
}

/**
 * Compute dagre layout with per-node sizes.
 */
export function computeDagreLayoutWithNodeSizes(
  nodeIds: string[],
  edges: Array<{ source: string; target: string }>,
  direction: LayoutDirection = "TB",
  sizeById: Map<string, NodeSize>,
  spacing: DagreSpacing = {}
): Map<string, XYPosition> {
  const graph = createDagreGraph(direction, spacing);

  // Add nodes with individual sizes
  for (const id of nodeIds) {
    const size = sizeById.get(id) ?? {
      width: DEFAULT_CONFIG.DEFAULT_NODE_WIDTH,
      height: DEFAULT_CONFIG.DEFAULT_NODE_HEIGHT,
    };
    graph.setNode(id, { width: size.width, height: size.height });
  }

  // Add edges
  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target);
  }

  dagre.layout(graph);

  return extractDagrePositionsWithSizes(graph, nodeIds, sizeById);
}

/**
 * Creates and configures a Dagre graph.
 */
function createDagreGraph(
  direction: LayoutDirection,
  spacing: DagreSpacing
): dagre.graphlib.Graph {
  const graph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  graph.setGraph({
    rankdir: direction,
    ranksep: spacing.rankSep ?? DEFAULT_CONFIG.DAGRE_RANK_SEP,
    nodesep: spacing.nodeSep ?? DEFAULT_CONFIG.DAGRE_NODE_SEP,
    edgesep: spacing.edgeSep ?? DEFAULT_CONFIG.DAGRE_EDGE_SEP,
  });

  return graph;
}

/**
 * Extracts positions from Dagre graph with uniform node size.
 */
function extractDagrePositions(
  graph: dagre.graphlib.Graph,
  nodeIds: string[],
  nodeSize: NodeSize
): Map<string, XYPosition> {
  const positions = new Map<string, XYPosition>();

  for (const id of nodeIds) {
    const nodeWithPos = graph.node(id);
    if (!nodeWithPos) continue;

    positions.set(id, {
      x: nodeWithPos.x - nodeSize.width / 2,
      y: nodeWithPos.y - nodeSize.height / 2,
    });
  }

  return positions;
}

/**
 * Extracts positions from Dagre graph with individual node sizes.
 */
function extractDagrePositionsWithSizes(
  graph: dagre.graphlib.Graph,
  nodeIds: string[],
  sizeById: Map<string, NodeSize>
): Map<string, XYPosition> {
  const positions = new Map<string, XYPosition>();

  for (const id of nodeIds) {
    const nodeWithPos = graph.node(id);
    const size = sizeById.get(id) ?? {
      width: DEFAULT_CONFIG.DEFAULT_NODE_WIDTH,
      height: DEFAULT_CONFIG.DEFAULT_NODE_HEIGHT,
    };

    if (!nodeWithPos) continue;

    positions.set(id, {
      x: nodeWithPos.x - size.width / 2,
      y: nodeWithPos.y - size.height / 2,
    });
  }

  return positions;
}

/**
 * Compute a custom ripple layout for complex subgraphs.
 */
export function computeRipplePositions(
  graph: DependencyGraph,
  subgraph: Subgraph,
  root: NodeRef,
  direction: LayoutDirection = "LR",
  spacing: RippleSpacing = {}
): Map<string, XYPosition> {
  const config = {
    rankSep: spacing.rankSep ?? DEFAULT_CONFIG.RIPPLE_RANK_SEP,
    nodeSep: spacing.nodeSep ?? DEFAULT_CONFIG.RIPPLE_NODE_SEP,
    bandSep: spacing.bandSep ?? DEFAULT_CONFIG.RIPPLE_BAND_SEP,
  };

  const isHorizontal = direction === "LR" || direction === "RL";
  const complexityCache = new ComplexityCache();
  const nodeById = NodeIdUtils.createNodeMap(subgraph.nodes);

  // Create scoring function with caching
  const getScore = (nodeId: string): number => {
    const node = nodeById.get(nodeId);
    return node ? complexityCache.getScore(graph, node, nodeId) : 0;
  };

  try {
    const positions = new Map<string, XYPosition>();

    // Compute derivation depths
    const depths = computeDerivationDepths(subgraph.nodes, subgraph.edges);

    // Build quick lookup of immediate dependencies (parents) per field
    const parentDeps = buildImmediateParentMap(subgraph.nodes, subgraph.edges);

    // Position root object
    const rootId = NodeIdUtils.getId(root);
    positions.set(rootId, { x: 0, y: 0 });

    // Position fields by layer
    positionFieldsByLayerAlignedToParents(
      subgraph.nodes,
      depths,
      parentDeps,
      positions,
      config,
      isHorizontal
    );

    // Position views in bands
    positionViewsInBands(
      subgraph.nodes,
      subgraph.edges,
      positions,
      config,
      isHorizontal,
      getScore
    );

    // Position scenes
    positionScenes(
      subgraph.nodes,
      subgraph.edges,
      positions,
      config,
      isHorizontal
    );

    return positions;
  } finally {
    complexityCache.clear();
  }
}

/**
 * Computes derivation depths using topological sorting.
 */
function computeDerivationDepths(
  nodes: NodeRef[],
  edges: Array<{ type: string; from: NodeRef; to: NodeRef }>
): Map<string, number> {
  const nodeIds = new Set(nodes.map(NodeIdUtils.getId));
  const reverseAdj = new Map<string, string[]>();
  const remainingDeps = new Map<string, number>();

  // Initialize
  for (const node of nodes) {
    remainingDeps.set(NodeIdUtils.getId(node), 0);
  }

  // Build reverse adjacency for derivesFrom edges
  for (const edge of edges) {
    if (edge.type !== "derivesFrom") continue;

    const derived = NodeIdUtils.getId(edge.from);
    const dependency = NodeIdUtils.getId(edge.to);

    if (!reverseAdj.has(dependency)) {
      reverseAdj.set(dependency, []);
    }
    reverseAdj.get(dependency)!.push(derived);

    remainingDeps.set(derived, (remainingDeps.get(derived) ?? 0) + 1);

    if (!remainingDeps.has(dependency)) {
      remainingDeps.set(dependency, 0);
    }
  }

  // Topological sort to compute depths
  const depth = new Map<string, number>();
  const queue: string[] = [];

  // Start with nodes that have no dependencies
  for (const nodeId of nodeIds) {
    if ((remainingDeps.get(nodeId) ?? 0) === 0) {
      depth.set(nodeId, 0);
      queue.push(nodeId);
    }
  }

  // Process queue
  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDepth = depth.get(current) ?? 0;

    for (const next of reverseAdj.get(current) ?? []) {
      depth.set(next, Math.max(depth.get(next) ?? 0, currentDepth + 1));

      const remaining = (remainingDeps.get(next) ?? 0) - 1;
      remainingDeps.set(next, remaining);

      if (remaining === 0) {
        queue.push(next);
      }
    }
  }

  return depth;
}

/**
 * Builds a map from a field nodeId to its immediate dependency nodeIds
 * based on derivesFrom edges (dependency graph edge: from=derived, to=dependency).
 */
function buildImmediateParentMap(
  nodes: NodeRef[],
  edges: Array<{ type: string; from: NodeRef; to: NodeRef }>
): Map<string, string[]> {
  const parents = new Map<string, string[]>();
  for (const n of nodes) {
    if (n.type !== "field") continue;
    parents.set(NodeIdUtils.getId(n), []);
  }
  for (const e of edges) {
    if (e.type !== "derivesFrom") continue;
    const childId = NodeIdUtils.getId(e.from); // derived field
    const parentId = NodeIdUtils.getId(e.to); // dependency input
    if (!parents.has(childId)) parents.set(childId, []);
    parents.get(childId)!.push(parentId);
  }
  return parents;
}

/**
 * Positions field nodes by layer, aligning each node's Y to the average of its parents' Y.
 * Falls back to layer centering when no parent position is known.
 */
function positionFieldsByLayerAlignedToParents(
  nodes: NodeRef[],
  depths: Map<string, number>,
  parents: Map<string, string[]>,
  positions: Map<string, XYPosition>,
  config: { rankSep: number; nodeSep: number },
  isHorizontal: boolean
): void {
  // Collect fields by depth layer
  const layers = new Map<number, string[]>();
  for (const node of nodes) {
    if (node.type !== "field") continue;
    const id = NodeIdUtils.getId(node);
    const depth = (depths.get(id) ?? 0) + 1; // Shift fields right of object
    if (!layers.has(depth)) layers.set(depth, []);
    layers.get(depth)!.push(id);
  }

  const sortedLayers = Array.from(layers.keys()).sort((a, b) => a - b);

  // Ensure base layer (0) exists for reference
  if (!positions.size) positions.set("__origin__", { x: 0, y: 0 });

  // Iteratively place layers left-to-right (or top-to-bottom)
  for (const depth of sortedLayers) {
    const ids = layers.get(depth)!;
    const baseX = isHorizontal ? depth * config.rankSep : 0;

    // Compute target Y from parents' Y when available
    const positioned: Array<{ id: string; y: number }> = [];
    const unpositioned: string[] = [];

    for (const id of ids) {
      const p = parents.get(id) ?? [];
      const parentPositions = p
        .map((pid) => positions.get(pid))
        .filter((pos): pos is XYPosition => !!pos);
      if (parentPositions.length) {
        const avgY =
          parentPositions.reduce((sum, pos) => sum + pos.y, 0) /
          parentPositions.length;
        positioned.push({ id, y: avgY });
      } else {
        unpositioned.push(id);
      }
    }

    // Resolve collisions: sort by target Y, then space by nodeSep
    positioned.sort((a, b) => a.y - b.y);
    const finalY = new Map<string, number>();
    let lastY = Number.NEGATIVE_INFINITY;
    for (const { id, y } of positioned) {
      const yPlaced =
        lastY === Number.NEGATIVE_INFINITY
          ? y
          : Math.max(y, lastY + config.nodeSep);
      finalY.set(id, yPlaced);
      lastY = yPlaced;
    }

    // Place unpositioned nodes centered around 0 and spaced
    if (unpositioned.length) {
      const half = (unpositioned.length - 1) / 2;
      for (let i = 0; i < unpositioned.length; i++) {
        const id = unpositioned[i];
        const y = (i - half) * config.nodeSep;
        finalY.set(id, y);
      }
    }

    // Write back positions
    for (const id of ids) {
      const y = finalY.get(id) ?? 0;
      const x = isHorizontal ? baseX : y;
      const yy = isHorizontal ? y : baseX;
      positions.set(id, { x, y: yy });
    }
  }
}

/**
 * Positions field nodes by their derivation layer.
 */
function positionFieldsByLayer(
  nodes: NodeRef[],
  depths: Map<string, number>,
  positions: Map<string, XYPosition>,
  config: { rankSep: number; nodeSep: number },
  isHorizontal: boolean,
  getScore: (nodeId: string) => number
): void {
  const layers = new Map<number, string[]>();

  // Collect fields by depth
  for (const node of nodes) {
    if (node.type !== "field") continue;

    const nodeId = NodeIdUtils.getId(node);
    const depth = (depths.get(nodeId) ?? 0) + 1; // Shift fields right of object

    if (!layers.has(depth)) {
      layers.set(depth, []);
    }
    layers.get(depth)!.push(nodeId);
  }

  // Position each layer
  const sortedLayerKeys = Array.from(layers.keys()).sort((a, b) => a - b);

  for (const layerKey of sortedLayerKeys) {
    const nodeIds = layers.get(layerKey)!;

    // Sort by complexity score (ascending)
    nodeIds.sort((a, b) => getScore(a) - getScore(b));

    const layerPositions = LayerPositioner.centerLayerVertically(
      nodeIds,
      isHorizontal ? layerKey * config.rankSep : 0,
      isHorizontal ? 0 : layerKey * config.rankSep,
      config.nodeSep,
      isHorizontal
    );

    // Merge positions
    for (const [id, position] of layerPositions) {
      positions.set(id, position);
    }
  }
}

/**
 * Positions view nodes in bands above their target fields.
 */
function positionViewsInBands(
  nodes: NodeRef[],
  edges: Array<{ type: string; from: NodeRef; to: NodeRef }>,
  positions: Map<string, XYPosition>,
  config: { rankSep: number; nodeSep: number; bandSep: number },
  isHorizontal: boolean,
  getScore: (nodeId: string) => number
): void {
  const viewPlacements = computeViewPlacements(
    nodes,
    edges,
    positions,
    config.rankSep,
    isHorizontal
  );

  // For each view, align vertically (or horizontally) with the average of its target fields
  for (const { id, layer } of viewPlacements) {
    // Compute average target coordinate from referenced fields
    const targetPositions: XYPosition[] = edges
      .filter(
        (e) => e.from.type === "view" && `${e.from.type}:${e.from.key}` === id
      )
      .filter((e) => e.type === "filtersBy" || e.type === "sortsBy")
      .map((e) => positions.get(`${e.to.type}:${e.to.key}`))
      .filter((p): p is XYPosition => !!p);

    // Fallback to layer's baseline if no targets resolved yet
    const avg = targetPositions.length
      ? targetPositions.reduce(
          (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
          { x: 0, y: 0 }
        )
      : { x: 0, y: 0 };
    if (targetPositions.length) {
      avg.x /= targetPositions.length;
      avg.y /= targetPositions.length;
    }

    // Place view one layer after its targets, aligned to their average axis
    const x = isHorizontal ? layer * config.rankSep : avg.x;
    const y = isHorizontal ? avg.y : layer * config.rankSep;

    positions.set(id, { x, y });
  }
}

/**
 * Computes target layers for view nodes based on their filtered/sorted fields.
 */
function computeViewPlacements(
  nodes: NodeRef[],
  edges: Array<{ type: string; from: NodeRef; to: NodeRef }>,
  positions: Map<string, XYPosition>,
  rankSep: number,
  isHorizontal: boolean
): Array<{ id: string; layer: number }> {
  const viewPlacements: Array<{ id: string; layer: number }> = [];

  for (const node of nodes) {
    if (node.type !== "view") continue;

    const nodeId = NodeIdUtils.getId(node);
    const targetLayers = edges
      .filter(
        (edge) =>
          edge.from.type === "view" &&
          NodeIdUtils.getId(edge.from) === nodeId &&
          (edge.type === "filtersBy" || edge.type === "sortsBy")
      )
      .map((edge) => NodeIdUtils.getId(edge.to))
      .map((targetId) => {
        const position = positions.get(targetId);
        if (!position) return undefined;

        return Math.round(
          isHorizontal ? position.x / rankSep : position.y / rankSep
        );
      })
      .filter((layer): layer is number => typeof layer === "number");

    const averageLayer = targetLayers.length
      ? Math.max(
          1,
          Math.round(
            targetLayers.reduce((a, b) => a + b, 0) / targetLayers.length
          )
        )
      : 1;

    // Place views one layer AFTER their referenced fields to reflect visual depth
    const layer = averageLayer + 1;
    viewPlacements.push({ id: nodeId, layer });
  }

  return viewPlacements;
}

/**
 * Groups view placements by their target layer.
 */
function groupViewsByLayer(
  viewPlacements: Array<{ id: string; layer: number }>
): Map<number, string[]> {
  const viewsByLayer = new Map<number, string[]>();

  for (const placement of viewPlacements) {
    if (!viewsByLayer.has(placement.layer)) {
      viewsByLayer.set(placement.layer, []);
    }
    viewsByLayer.get(placement.layer)!.push(placement.id);
  }

  return viewsByLayer;
}

/**
 * Positions scene nodes near their associated views.
 */
function positionScenes(
  nodes: NodeRef[],
  edges: Array<{ type: string; from: NodeRef; to: NodeRef }>,
  positions: Map<string, XYPosition>,
  config: { rankSep: number; bandSep: number },
  isHorizontal: boolean
): void {
  for (const node of nodes) {
    if (node.type !== "scene") continue;

    const nodeId = NodeIdUtils.getId(node);
    const associatedViewIds = edges
      .filter(
        (edge) =>
          edge.from.type === "scene" &&
          NodeIdUtils.getId(edge.from) === nodeId &&
          edge.to.type === "view"
      )
      .map((edge) => NodeIdUtils.getId(edge.to));

    const layersForScene = associatedViewIds
      .map((viewId) => positions.get(viewId))
      .filter(Boolean)
      .map((position) =>
        Math.round(
          isHorizontal
            ? (position as XYPosition).x / config.rankSep
            : (position as XYPosition).y / config.rankSep
        )
      );

    const targetLayer = layersForScene.length ? Math.min(...layersForScene) : 1;
    const baseX = isHorizontal ? targetLayer * config.rankSep : 0;
    const baseY = isHorizontal
      ? -config.bandSep * 2
      : targetLayer * config.rankSep - config.bandSep * 2;

    positions.set(nodeId, { x: baseX, y: baseY });
  }
}

/**
 * Centers the view on a focus node if needed, with improved position tracking.
 */
export function centerOnNodeIfNeeded({
  flowNodes,
  focusNodeId,
  rfRef,
  lastPositionsRef,
}: {
  flowNodes: FlowNode[];
  focusNodeId: string | undefined;
  rfRef: React.RefObject<ReactFlowInstance | null>;
  lastPositionsRef: React.MutableRefObject<Map<string, XYPosition>>;
}): void {
  const currentPositions = new Map<string, XYPosition>();
  for (const node of flowNodes) {
    currentPositions.set(String(node.id), node.position);
  }

  if (!focusNodeId) {
    lastPositionsRef.current = currentPositions;
    return;
  }

  const previousPosition = lastPositionsRef.current.get(focusNodeId);
  const currentPosition = currentPositions.get(focusNodeId);

  lastPositionsRef.current = currentPositions;

  const viewport = rfRef.current?.getViewport?.() ?? { zoom: 1 };
  const zoom = typeof viewport.zoom === "number" ? viewport.zoom : 1;

  // If no previous position exists, center immediately
  if (!previousPosition && currentPosition) {
    rfRef.current?.setCenter?.(
      currentPosition.x + DEFAULT_CONFIG.CENTER_OFFSET_X,
      currentPosition.y + DEFAULT_CONFIG.CENTER_OFFSET_Y,
      { zoom, duration: 0 }
    );
    return;
  }

  // If both positions exist, check if the shift is significant
  if (previousPosition && currentPosition) {
    const deltaX = currentPosition.x - previousPosition.x;
    const deltaY = currentPosition.y - previousPosition.y;
    const shiftDistance = Math.hypot(deltaX * zoom, deltaY * zoom);

    if (shiftDistance > DEFAULT_CONFIG.MIN_SHIFT_THRESHOLD) {
      rfRef.current?.setCenter?.(
        currentPosition.x + DEFAULT_CONFIG.CENTER_OFFSET_X,
        currentPosition.y + DEFAULT_CONFIG.CENTER_OFFSET_Y,
        { zoom, duration: 0 }
      );
    }
  }
}
