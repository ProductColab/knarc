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

    console.log("[layout:ripple] Computing ripple positions", {
      rootId,
      totalNodes: subgraph.nodes.length,
      totalEdges: subgraph.edges.length,
      fieldNodes: subgraph.nodes.filter((n) => n.type === "field").length,
      depths: Array.from(depths.entries()).map(([id, depth]) => ({
        id,
        depth,
      })),
    });

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

    console.log("[layout:ripple] Final positions computed", {
      totalPositions: positions.size,
      samplePositions: Array.from(positions.entries())
        .slice(0, 20)
        .map(([id, pos]) => ({ id, x: pos.x.toFixed(1), y: pos.y.toFixed(1) })),
      fieldPositions: Array.from(positions.entries())
        .filter(([id]) => id.startsWith("field:"))
        .map(([id, pos]) => ({ id, x: pos.x.toFixed(1), y: pos.y.toFixed(1) })),
    });

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

  console.log("[layout:parent-map] Built parent map", {
    totalFields: parents.size,
    fieldsWithParents: Array.from(parents.entries())
      .filter(([_, p]) => p.length > 0)
      .map(([id, p]) => ({ id, parents: p })),
    fieldsWithoutParents: Array.from(parents.entries())
      .filter(([_, p]) => p.length === 0)
      .map(([id]) => id),
  });

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

    console.log(`[layout:layer] Processing depth ${depth}`, {
      nodeCount: ids.length,
      nodeIds: ids,
    });

    // Compute target Y from parents' Y when available
    // Group nodes by their parent(s) to maintain parent-child relationships
    const positioned: Array<{ id: string; y: number; parentIds: string[] }> =
      [];
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
        positioned.push({ id, y: avgY, parentIds: p });
      } else {
        unpositioned.push(id);
      }
    }

    console.log(
      `[layout:layer:${depth}] Positioned nodes:`,
      positioned.map((n) => ({
        id: n.id,
        targetY: n.y.toFixed(1),
        parents: n.parentIds,
      }))
    );

    // Group nodes by their parent set (nodes with same parents should be grouped together)
    const parentGroups = new Map<
      string,
      { nodes: Array<{ id: string; y: number }>; parentY: number }
    >();
    for (const { id, y, parentIds } of positioned) {
      // Create a stable key for the parent set
      const parentKey = parentIds.sort().join(",");
      if (!parentGroups.has(parentKey)) {
        // Calculate the actual parent Y position (average of all parents in the set)
        const parentPositions = parentIds
          .map((pid) => positions.get(pid))
          .filter((pos): pos is XYPosition => !!pos);
        const parentY =
          parentPositions.length > 0
            ? parentPositions.reduce((sum, pos) => sum + pos.y, 0) /
              parentPositions.length
            : y;
        parentGroups.set(parentKey, { nodes: [], parentY });
      }
      parentGroups.get(parentKey)!.nodes.push({ id, y });
    }

    console.log(
      `[layout:layer:${depth}] Parent groups:`,
      Array.from(parentGroups.entries()).map(([key, group]) => ({
        parentKey: key,
        parentY: group.parentY.toFixed(1),
        nodeCount: group.nodes.length,
        nodeIds: group.nodes.map((n) => n.id),
      }))
    );

    // Sort groups by their parent Y position
    const sortedGroups = Array.from(parentGroups.entries())
      .map(([parentKey, group]) => ({
        parentKey,
        nodes: group.nodes,
        parentY: group.parentY,
      }))
      .sort((a, b) => a.parentY - b.parentY);

    // Position nodes within each group relative to their parent's Y, then space groups
    const finalY = new Map<string, number>();
    let lastGroupEndY = Number.NEGATIVE_INFINITY;

    for (const { nodes, parentY } of sortedGroups) {
      // Sort nodes within group by their target Y
      nodes.sort((a, b) => a.y - b.y);

      // Position nodes within this group centered around the parent's Y
      const groupCenterY = parentY;
      const groupHeight = (nodes.length - 1) * config.nodeSep;
      const idealGroupStartY = groupCenterY - groupHeight / 2;
      const idealGroupEndY = groupCenterY + groupHeight / 2;

      // Calculate where this group should start to avoid overlap with previous group
      // But prioritize staying close to the parent's Y position
      let groupStartY = idealGroupStartY;

      if (lastGroupEndY !== Number.NEGATIVE_INFINITY) {
        // Need spacing from previous group
        const minStartY = lastGroupEndY + config.nodeSep;

        // If the ideal position would overlap, we have two options:
        // 1. Shift this group down (away from parent)
        // 2. Shift previous group up (towards its parent) if it helps
        // We'll try to minimize the total deviation from parent positions

        if (idealGroupStartY < minStartY) {
          // Check if we can shift the previous group up instead
          // This helps when groups are close together
          const overlap = minStartY - idealGroupStartY;
          const canShiftPrevious = overlap < config.nodeSep / 2;

          if (canShiftPrevious && sortedGroups.length > 1) {
            // Try to shift previous group nodes up slightly
            // This is a heuristic to keep groups closer to their parents
            groupStartY = idealGroupStartY;
            // We'll handle spacing in the node placement loop
          } else {
            // Shift this group down
            groupStartY = minStartY;
          }
        }
      }

      // Place nodes within the group, ensuring they stay close to parent
      for (let i = 0; i < nodes.length; i++) {
        const { id } = nodes[i];
        const idealY = groupStartY + i * config.nodeSep;

        // Ensure spacing from previous node in this group
        const yPlaced =
          i === 0
            ? idealY
            : Math.max(idealY, finalY.get(nodes[i - 1].id)! + config.nodeSep);

        // Ensure node is closer to its parent than to any other parent
        // This prevents nodes from being positioned at the midpoint between parents
        const distanceToParent = Math.abs(yPlaced - parentY);
        const otherParents = sortedGroups
          .filter((g) => g.parentY !== parentY)
          .map((g) => g.parentY);

        let adjustedY = yPlaced;
        const minSpacing =
          i === 0
            ? Number.NEGATIVE_INFINITY
            : finalY.get(nodes[i - 1].id)! + config.nodeSep;

        for (const otherParentY of otherParents) {
          const distanceToOther = Math.abs(yPlaced - otherParentY);
          // If we're equidistant or closer to another parent, we need to adjust
          if (distanceToOther <= distanceToParent) {
            // Calculate the midpoint and shift towards our parent
            const midpoint = (parentY + otherParentY) / 2;
            const isOnMidpoint = Math.abs(yPlaced - midpoint) < 1;

            if (isOnMidpoint || distanceToOther < distanceToParent) {
              // Shift towards our parent by at least 1 unit to ensure we're strictly closer
              const shiftAmount = Math.max(
                1,
                (distanceToParent - distanceToOther) / 2 + 1
              );
              const shiftDirection = parentY > yPlaced ? 1 : -1;
              const candidateY =
                yPlaced +
                shiftDirection * Math.min(shiftAmount, config.nodeSep / 3);

              // Use adjusted position if it maintains spacing
              if (candidateY >= minSpacing) {
                adjustedY = candidateY;
                break;
              } else {
                // If we can't shift this node, try shifting the previous node up
                // This creates more room for this node to move towards its parent
                if (i > 0) {
                  const prevId = nodes[i - 1].id;
                  const prevY = finalY.get(prevId)!;
                  const prevShift = minSpacing - candidateY + 1;
                  const prevCandidateY = prevY - prevShift;

                  // Only shift previous if it doesn't violate its own constraints
                  if (
                    i === 1 ||
                    prevCandidateY >=
                      finalY.get(nodes[i - 2].id)! + config.nodeSep
                  ) {
                    finalY.set(prevId, prevCandidateY);
                    adjustedY = candidateY;
                    break;
                  }
                }
              }
            }
          }
        }

        finalY.set(id, adjustedY);
      }

      // Update last group end position
      const lastNodeInGroup = nodes[nodes.length - 1];
      lastGroupEndY = finalY.get(lastNodeInGroup.id)!;

      console.log(`[layout:layer:${depth}] Group positioned:`, {
        parentY: parentY.toFixed(1),
        nodeCount: nodes.length,
        positions: nodes.map((n) => ({
          id: n.id,
          y: finalY.get(n.id)!.toFixed(1),
        })),
      });
    }

    // Place unpositioned nodes centered around 0 and spaced
    if (unpositioned.length) {
      console.log(
        `[layout:layer:${depth}] Unpositioned nodes (no parents found):`,
        unpositioned
      );
      const half = (unpositioned.length - 1) / 2;
      for (let i = 0; i < unpositioned.length; i++) {
        const id = unpositioned[i];
        const y = (i - half) * config.nodeSep;
        finalY.set(id, y);
      }
      console.log(
        `[layout:layer:${depth}] Unpositioned nodes placed:`,
        unpositioned.map((id) => ({
          id,
          y: finalY.get(id)!.toFixed(1),
        }))
      );
    }

    // Write back positions
    for (const id of ids) {
      const y = finalY.get(id) ?? 0;
      const x = isHorizontal ? baseX : y;
      const yy = isHorizontal ? y : baseX;
      positions.set(id, { x, y: yy });
    }

    console.log(
      `[layout:layer:${depth}] Final positions:`,
      ids.map((id) => {
        const pos = positions.get(id)!;
        return { id, x: pos.x.toFixed(1), y: pos.y.toFixed(1) };
      })
    );
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
 * Groups views by their target field(s) to prevent bunching when multiple views reference the same fields.
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

  // Edge types that indicate view->field dependencies for positioning
  const viewToFieldEdgeTypes = ["filtersBy", "sortsBy", "uses"];

  // Group views by their target field set
  const viewGroups = new Map<
    string,
    {
      views: Array<{ id: string; layer: number }>;
      targetFields: string[];
      avgFieldY: number;
    }
  >();

  for (const { id, layer } of viewPlacements) {
    // Find all fields this view references
    const targetFields = edges
      .filter(
        (e) =>
          e.from.type === "view" &&
          NodeIdUtils.getId(e.from) === id &&
          viewToFieldEdgeTypes.includes(e.type)
      )
      .map((e) => NodeIdUtils.getId(e.to))
      .filter((fieldId) => positions.has(fieldId));

    // Create a stable key for the target field set
    const fieldKey = targetFields.sort().join(",");

    if (!viewGroups.has(fieldKey)) {
      // Calculate average Y position of target fields
      const targetPositions = targetFields
        .map((fieldId) => positions.get(fieldId))
        .filter((p): p is XYPosition => !!p);

      const avgFieldY =
        targetPositions.length > 0
          ? targetPositions.reduce((sum, p) => sum + p.y, 0) /
            targetPositions.length
          : 0;

      viewGroups.set(fieldKey, {
        views: [],
        targetFields,
        avgFieldY,
      });
    }

    viewGroups.get(fieldKey)!.views.push({ id, layer });
  }

  // Sort groups by their average field Y position
  const sortedGroups = Array.from(viewGroups.values()).sort(
    (a, b) => a.avgFieldY - b.avgFieldY
  );

  console.log("[layout:views] View groups by target fields", {
    totalGroups: sortedGroups.length,
    groups: sortedGroups.map((g) => ({
      targetFields: g.targetFields,
      avgFieldY: g.avgFieldY.toFixed(1),
      viewCount: g.views.length,
      viewIds: g.views.map((v) => v.id),
    })),
  });

  // Position views within each group, then space groups
  let lastGroupEndY = Number.NEGATIVE_INFINITY;

  for (const group of sortedGroups) {
    // Sort views within group by layer, then by score
    group.views.sort((a, b) => {
      if (a.layer !== b.layer) return a.layer - b.layer;
      return getScore(a.id) - getScore(b.id);
    });

    // Position views within this group centered around the average field Y
    const groupCenterY = group.avgFieldY;
    const groupHeight = (group.views.length - 1) * config.nodeSep;
    const idealGroupStartY = groupCenterY - groupHeight / 2;

    // Ensure minimum spacing from previous group
    const groupStartY =
      lastGroupEndY === Number.NEGATIVE_INFINITY
        ? idealGroupStartY
        : Math.max(idealGroupStartY, lastGroupEndY + config.nodeSep);

    // Place views within the group
    for (let i = 0; i < group.views.length; i++) {
      const { id, layer } = group.views[i];
      const idealY = groupStartY + i * config.nodeSep;

      // Ensure spacing from previous view in this group
      let yPlaced =
        i === 0
          ? idealY
          : Math.max(
              idealY,
              positions.get(group.views[i - 1].id)!.y + config.nodeSep
            );

      // Ensure view is closer to its target field(s) than to other fields
      // This prevents views from being positioned at the midpoint between fields
      const distanceToTarget = Math.abs(yPlaced - groupCenterY);
      const otherGroups = sortedGroups.filter((g) => g !== group);
      
      for (const otherGroup of otherGroups) {
        const distanceToOther = Math.abs(yPlaced - otherGroup.avgFieldY);
        // If we're equidistant or closer to another field, shift towards our target
        if (distanceToOther <= distanceToTarget) {
          const midpoint = (groupCenterY + otherGroup.avgFieldY) / 2;
          const isOnMidpoint = Math.abs(yPlaced - midpoint) < 1;
          
          if (isOnMidpoint || distanceToOther < distanceToTarget) {
            // Shift towards our target field by at least 1 unit
            const shiftAmount = Math.max(1, (distanceToTarget - distanceToOther) / 2 + 1);
            const shiftDirection = groupCenterY > yPlaced ? 1 : -1;
            const candidateY = yPlaced + shiftDirection * Math.min(shiftAmount, config.nodeSep / 3);
            
            // Use adjusted position if it maintains spacing
            const minSpacing = i === 0 ? Number.NEGATIVE_INFINITY : positions.get(group.views[i - 1].id)!.y + config.nodeSep;
            if (candidateY >= minSpacing) {
              yPlaced = candidateY;
              break;
            } else if (i > 0) {
              // If we can't shift this view, try shifting the previous view up
              // This creates more room for this view to move towards its target
              const prevId = group.views[i - 1].id;
              const prevY = positions.get(prevId)!;
              const prevShift = minSpacing - candidateY + 1;
              const prevCandidateY = prevY - prevShift;
              
              // Only shift previous if it doesn't violate its own constraints
              const prevMinSpacing = i === 1 ? Number.NEGATIVE_INFINITY : positions.get(group.views[i - 2].id)!.y + config.nodeSep;
              if (prevCandidateY >= prevMinSpacing) {
                positions.set(prevId, { ...positions.get(prevId)!, y: prevCandidateY });
                yPlaced = candidateY;
                break;
              }
            }
          }
        }
      }

      // Calculate X position based on layer
      const x = isHorizontal ? layer * config.rankSep : groupCenterY;
      const y = isHorizontal ? yPlaced : layer * config.rankSep;

      positions.set(id, { x, y });
    }

    // Update last group end position
    const lastViewInGroup = group.views[group.views.length - 1];
    lastGroupEndY = positions.get(lastViewInGroup.id)!.y;
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

  // Edge types that indicate view->field dependencies
  const viewToFieldEdgeTypes = ["filtersBy", "sortsBy", "uses"];

  for (const node of nodes) {
    if (node.type !== "view") continue;

    const nodeId = NodeIdUtils.getId(node);
    const targetLayers = edges
      .filter(
        (edge) =>
          edge.from.type === "view" &&
          NodeIdUtils.getId(edge.from) === nodeId &&
          viewToFieldEdgeTypes.includes(edge.type)
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
