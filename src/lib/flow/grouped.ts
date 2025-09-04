import type { Position } from "@xyflow/react";
import { Subgraph } from "@/lib/deps/serialize";
import { Edge as DepEdge, NodeRef, toNodeId } from "@/lib/deps/types";
import { AppNode, EntityKind } from "@/lib/types";
import type { FlowGraph, AppEdge } from "@/lib/flow/adapter";
import { labelFor } from "@/lib/flow/adapter";
import { computeDagreLayout } from "@/lib/flow/layout";
import { DependencyGraph } from "@/lib/deps/graph";
import { computeComplexity } from "@/lib/services/complexity";

const DEFAULT_NODE_WIDTH = 220;
const DEFAULT_NODE_HEIGHT = 48;
const GROUP_NODE_OFFSET_X = 220;
const GROUP_NODE_OFFSET_Y = 160;

export type IsGroupCollapsedFn = (root: NodeRef, type: EntityKind) => boolean;

/**
 * Returns the source and target positions for a node based on the layout direction.
 */
export function getNodePositions(direction: "TB" | "BT" | "LR" | "RL"): {
  sourcePosition: Position;
  targetPosition: Position;
} {
  const isHorizontal = direction === "LR" || direction === "RL";
  const sourcePosition: Position = isHorizontal
    ? direction === "LR"
      ? ("right" as Position)
      : ("left" as Position)
    : direction === "TB"
    ? ("bottom" as Position)
    : ("top" as Position);
  const targetPosition: Position = isHorizontal
    ? direction === "LR"
      ? ("left" as Position)
      : ("right" as Position)
    : direction === "TB"
    ? ("top" as Position)
    : ("bottom" as Position);
  return { sourcePosition, targetPosition };
}

/**
 * Groups direct incoming or outgoing edges by the type of their neighbor node.
 */
export function groupEdgesByNeighborType(
  edges: DepEdge[],
  getNeighbor: (e: DepEdge) => NodeRef
): Map<EntityKind, NodeRef[]> {
  const byType = new Map<EntityKind, NodeRef[]>();
  for (const e of edges) {
    const neighbor = getNeighbor(e);
    const t = neighbor.type;
    if (!byType.has(t)) byType.set(t, []);
    const list = byType.get(t)!;
    if (!list.find((n) => toNodeId(n) === toNodeId(neighbor)))
      list.push(neighbor);
  }
  return byType;
}

/**
 * Returns a set of node IDs that should be suppressed (hidden) because their group is collapsed.
 */
export function getSuppressedNodeIds(
  root: NodeRef,
  incomingByType: Map<EntityKind, NodeRef[]>,
  outgoingByType: Map<EntityKind, NodeRef[]>,
  isGroupCollapsed: IsGroupCollapsedFn
): Set<string> {
  const suppressedIds = new Set<string>();
  const allTypes = new Set<EntityKind>([
    ...incomingByType.keys(),
    ...outgoingByType.keys(),
  ]);
  for (const t of allTypes) {
    if (isGroupCollapsed(root, t)) {
      for (const n of incomingByType.get(t) ?? [])
        suppressedIds.add(toNodeId(n));
      for (const n of outgoingByType.get(t) ?? [])
        suppressedIds.add(toNodeId(n));
    }
  }
  return suppressedIds;
}

/**
 * Returns the set of node IDs to keep (not suppressed), always including the root.
 */
export function getKeptNodeIds(
  subgraph: Subgraph,
  suppressedIds: Set<string>,
  rootId: string
): Set<string> {
  const keptNodeIds = new Set<string>(
    subgraph.nodes
      .map((n) => toNodeId(n))
      .filter((id) => !suppressedIds.has(id))
  );
  keptNodeIds.add(rootId);
  return keptNodeIds;
}

/**
 * Groups edges by their source and target, collecting all edge types between each pair.
 */
export function groupEdgesBySourceTarget(
  edges: DepEdge[]
): Map<
  string,
  { source: string; target: string; labels: string[]; edges: DepEdge[] }
> {
  const groupedEdgeMap = new Map<
    string,
    { source: string; target: string; labels: string[]; edges: DepEdge[] }
  >();
  for (const e of edges) {
    const source = toNodeId(e.from);
    const target = toNodeId(e.to);
    const key = `${source}->${target}`;
    const label = `${e.type}`;
    if (!groupedEdgeMap.has(key)) {
      groupedEdgeMap.set(key, { source, target, labels: [label], edges: [e] });
    } else {
      const g = groupedEdgeMap.get(key)!;
      if (!g.labels.includes(label)) g.labels.push(label);
      g.edges.push(e);
    }
  }
  return groupedEdgeMap;
}

/**
 * Returns a human-readable title for a node type.
 */
export function getTitleForNodeType(t: EntityKind): string {
  switch (t) {
    case "object":
      return "Objects";
    case "field":
      return "Fields";
    case "view":
      return "Views";
    case "scene":
      return "Scenes";
    default:
      return String(t);
  }
}

/**
 * Calculates the centroid position for a group node, or a default offset if no neighbors.
 */
export function calculateGroupNodePosition(
  neighbors: NodeRef[],
  positions: Map<string, { x: number; y: number }>,
  rootId: string,
  root: NodeRef,
  direction: "TB" | "BT" | "LR" | "RL"
): { x: number; y: number } {
  const isHorizontal = direction === "LR" || direction === "RL";
  let cx = 0;
  let cy = 0;
  let count = 0;
  for (const n of neighbors) {
    const p = positions.get(toNodeId(n));
    if (!p) continue;
    cx += p.x;
    cy += p.y;
    count += 1;
  }
  if (count > 0) {
    cx /= count;
    cy /= count;
  } else {
    const rp = positions.get(rootId) ?? { x: 0, y: 0 };
    cx =
      rp.x +
      (isHorizontal
        ? direction === "RL"
          ? -GROUP_NODE_OFFSET_X
          : GROUP_NODE_OFFSET_X
        : 0);
    cy =
      rp.y +
      (!isHorizontal
        ? direction === "BT"
          ? -GROUP_NODE_OFFSET_Y
          : GROUP_NODE_OFFSET_Y
        : 0);
  }
  return { x: cx, y: cy };
}

/**
 * Main function to convert a dependency subgraph into a grouped flow graph for visualization
 */
export function toGroupedFlow(
  subgraph: Subgraph,
  initialPositions: Map<string, { x: number; y: number }>,
  root: NodeRef,
  direction: "TB" | "BT" | "LR" | "RL" = "TB",
  isGroupCollapsed: IsGroupCollapsedFn
): FlowGraph {
  const rootId = toNodeId(root);
  const { sourcePosition, targetPosition } = getNodePositions(direction);

  const directIncoming: DepEdge[] = subgraph.edges.filter(
    (e) => toNodeId(e.to) === rootId
  );
  const directOutgoing: DepEdge[] = subgraph.edges.filter(
    (e) => toNodeId(e.from) === rootId
  );

  const incomingByType = groupEdgesByNeighborType(
    directIncoming,
    (e) => e.from
  );
  const outgoingByType = groupEdgesByNeighborType(directOutgoing, (e) => e.to);

  const suppressedIds = getSuppressedNodeIds(
    root,
    incomingByType,
    outgoingByType,
    isGroupCollapsed
  );

  const keptNodeIds = getKeptNodeIds(subgraph, suppressedIds, rootId);

  const trimmedNodes: NodeRef[] = subgraph.nodes.filter((n) =>
    keptNodeIds.has(toNodeId(n))
  );
  const expandedTypes = new Set<EntityKind>(
    [...incomingByType.keys(), ...outgoingByType.keys()].filter(
      (t) => !isGroupCollapsed(root, t)
    )
  );
  const expandedIncomingNeighbors = new Set<string>();
  for (const t of incomingByType.keys()) {
    if (!expandedTypes.has(t)) continue;
    for (const n of incomingByType.get(t) ?? [])
      expandedIncomingNeighbors.add(toNodeId(n));
  }
  const expandedOutgoingNeighbors = new Set<string>();
  for (const t of outgoingByType.keys()) {
    if (!expandedTypes.has(t)) continue;
    for (const n of outgoingByType.get(t) ?? [])
      expandedOutgoingNeighbors.add(toNodeId(n));
  }
  // For ripple view, keep direct edges between root and peers so they stay connected.
  const trimmedEdges: DepEdge[] = subgraph.edges.filter((e) => {
    const fromId = toNodeId(e.from);
    const toId = toNodeId(e.to);
    if (!keptNodeIds.has(fromId) || !keptNodeIds.has(toId)) return false;
    return true;
  });

  // Debug: verify root connectivity in trimmedEdges
  try {
    const rootEdgeCountOut = trimmedEdges.filter(
      (e) => toNodeId(e.from) === rootId
    ).length;
    const rootEdgeCountIn = trimmedEdges.filter(
      (e) => toNodeId(e.to) === rootId
    ).length;
    // eslint-disable-next-line no-console
    console.debug("[ripple] root connectivity:", {
      root: rootId,
      outgoing: rootEdgeCountOut,
      incoming: rootEdgeCountIn,
      keptNodes: keptNodeIds.size,
      totalEdges: trimmedEdges.length,
    });
  } catch {}

  // Create flow nodes for visualization
  const nodes: AppNode[] = trimmedNodes.map((n) => ({
    id: toNodeId(n),
    type: "entity",
    position: initialPositions.get(toNodeId(n)) ?? { x: 0, y: 0 },
    data: { label: labelFor(n), node: n, entityKind: n.type },
    targetPosition,
    sourcePosition,
  }));

  // Group edges by source and target, collecting all edge types between each pair
  const groupedEdgeMap = groupEdgesBySourceTarget(trimmedEdges);

  // Create flow edges for visualization
  const edges: AppEdge[] = Array.from(groupedEdgeMap.values()).map((g) => ({
    id: `${g.source}->${g.target}`,
    source: g.source,
    target: g.target,
    type: "usage",
    data: { label: g.labels.join("\n") },
  }));

  // Add group nodes and group edges for each present type
  const allTypes = new Set<EntityKind>([
    ...incomingByType.keys(),
    ...outgoingByType.keys(),
  ]);
  for (const t of allTypes) {
    const incoming = incomingByType.get(t) ?? [];
    const outgoing = outgoingByType.get(t) ?? [];
    const neighbors = [...incoming, ...outgoing];
    if (neighbors.length === 0) continue;
    const groupId = `group:${root.type}:${root.key}:${t}`;
    const groupPosition = calculateGroupNodePosition(
      neighbors,
      initialPositions,
      rootId,
      root,
      direction
    );

    const title = getTitleForNodeType(t);
    const groupNode: AppNode = {
      id: groupId,
      type: "groupNode",
      position: groupPosition,
      data: {
        title,
        count: neighbors.length,
        root,
        groupType: t,
      },
      targetPosition,
      sourcePosition,
    };

    nodes.push(groupNode);

    const collapsed = isGroupCollapsed(root, t);
    // Always connect group to root to keep the hub visible
    if (incoming.length > 0) {
      edges.push({
        id: `${groupId}->${rootId}`,
        source: groupId,
        target: rootId,
        type: "usage",
        data: { label: `${incoming.length} in` },
      });
    }
    if (outgoing.length > 0) {
      edges.push({
        id: `${rootId}->${groupId}`,
        source: rootId,
        target: groupId,
        type: "usage",
        data: { label: `${outgoing.length} out` },
      });
    }
    // If expanded, re-attach children to the group node instead of the root
    if (!collapsed) {
      for (const n of outgoing) {
        const nid = toNodeId(n);
        if (!keptNodeIds.has(nid)) continue;
        const matching = directOutgoing.filter((e) => toNodeId(e.to) === nid);
        const labels = Array.from(new Set(matching.map((e) => `${e.type}`)));
        edges.push({
          id: `${groupId}->${nid}`,
          source: groupId,
          target: nid,
          type: "usage",
          data: { label: labels.join("\n"), dep: matching[0] },
        });
      }
      for (const n of incoming) {
        const nid = toNodeId(n);
        if (!keptNodeIds.has(nid)) continue;
        const matching = directIncoming.filter((e) => toNodeId(e.from) === nid);
        const labels = Array.from(new Set(matching.map((e) => `${e.type}`)));
        edges.push({
          id: `${nid}->${groupId}`,
          source: nid,
          target: groupId,
          type: "usage",
          data: { label: labels.join("\n"), dep: matching[0] },
        });
      }
    }
  }

  const allNodeIds = nodes.map((n) => n.id);
  const layoutEdges = edges.map((e) => ({
    source: e.source,
    target: e.target,
  }));
  const laidOut = computeDagreLayout(
    [rootId, ...allNodeIds.filter((id) => id !== rootId)],
    layoutEdges,
    direction,
    {
      width: DEFAULT_NODE_WIDTH,
      height: DEFAULT_NODE_HEIGHT,
    }
  );
  for (const n of nodes) {
    const p = laidOut.get(n.id);
    if (p) n.position = p;
  }
  return { nodes, edges };
}

/**
 * Ripple-focused grouped flow: renders nodes as "ripple" with complexity scores.
 */
export function toRippleGroupedFlow(
  graph: DependencyGraph,
  subgraph: Subgraph,
  initialPositions: Map<string, { x: number; y: number }>,
  root: NodeRef,
  direction: "TB" | "BT" | "LR" | "RL" = "TB",
  isGroupCollapsed: IsGroupCollapsedFn
): FlowGraph {
  const rootId = toNodeId(root);
  const { sourcePosition, targetPosition } = getNodePositions(direction);

  const directIncoming: DepEdge[] = subgraph.edges.filter(
    (e) => toNodeId(e.to) === rootId
  );
  const directOutgoing: DepEdge[] = subgraph.edges.filter(
    (e) => toNodeId(e.from) === rootId
  );

  const incomingByType = groupEdgesByNeighborType(
    directIncoming,
    (e) => e.from
  );
  const outgoingByType = groupEdgesByNeighborType(directOutgoing, (e) => e.to);

  const suppressedIds = getSuppressedNodeIds(
    root,
    incomingByType,
    outgoingByType,
    isGroupCollapsed
  );

  const keptNodeIds = getKeptNodeIds(subgraph, suppressedIds, rootId);

  const trimmedNodes: NodeRef[] = subgraph.nodes.filter((n) =>
    keptNodeIds.has(toNodeId(n))
  );
  const expandedTypes = new Set<EntityKind>(
    [...incomingByType.keys(), ...outgoingByType.keys()].filter(
      (t) => !isGroupCollapsed(root, t)
    )
  );
  const expandedIncomingNeighbors = new Set<string>();
  for (const t of incomingByType.keys()) {
    if (!expandedTypes.has(t)) continue;
    for (const n of incomingByType.get(t) ?? [])
      expandedIncomingNeighbors.add(toNodeId(n));
  }
  const expandedOutgoingNeighbors = new Set<string>();
  for (const t of outgoingByType.keys()) {
    if (!expandedTypes.has(t)) continue;
    for (const n of outgoingByType.get(t) ?? [])
      expandedOutgoingNeighbors.add(toNodeId(n));
  }
  const trimmedEdges: DepEdge[] = subgraph.edges.filter((e) => {
    const fromId = toNodeId(e.from);
    const toId = toNodeId(e.to);
    if (!keptNodeIds.has(fromId) || !keptNodeIds.has(toId)) return false;
    if (fromId === rootId && expandedOutgoingNeighbors.has(toId)) return false;
    if (toId === rootId && expandedIncomingNeighbors.has(fromId)) return false;
    return true;
  });

  const nodes: AppNode[] = trimmedNodes.map((n) => {
    const c = computeComplexity(graph, n);
    return {
      id: toNodeId(n),
      type: "ripple",
      position: initialPositions.get(toNodeId(n)) ?? { x: 0, y: 0 },
      data: {
        label: labelFor(n),
        score: c.score,
        entityKind: n.type as EntityKind,
        isRoot: toNodeId(n) === rootId,
      },
      targetPosition,
      sourcePosition,
    } as AppNode;
  });

  const groupedEdgeMap = groupEdgesBySourceTarget(trimmedEdges);
  const edges: AppEdge[] = Array.from(groupedEdgeMap.values()).map((g) => ({
    id: `${g.source}->${g.target}`,
    source: g.source,
    target: g.target,
    type: "usage",
    data: { label: g.labels.join("\n") },
  }));

  const allNodeIds = nodes.map((n) => n.id);
  const layoutEdges = edges.map((e) => ({
    source: e.source,
    target: e.target,
  }));
  const laidOut = computeDagreLayout(allNodeIds, layoutEdges, direction, {
    width: DEFAULT_NODE_WIDTH,
    height: DEFAULT_NODE_HEIGHT,
  });
  for (const n of nodes) {
    const p = laidOut.get(n.id);
    if (p) n.position = p;
  }
  return { nodes, edges };
}
