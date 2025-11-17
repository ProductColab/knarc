import { useMemo, useEffect, useCallback, useRef, useState } from "react";
import { useGraphStore } from "@/lib/store/graphStore";
import { useKnackGraph } from "@/lib/hooks/use-knack";
import {
  computeDagreLayoutForSubgraph,
  computeRipplePositions,
} from "@/lib/flow/layout";
import { toGroupedFlow } from "@/lib/flow/grouped";
import {
  toRippleFlowSimple,
  toRippleFlowWithPositions,
} from "@/lib/flow/adapter";
import { buildNeighborhoodSubgraph } from "@/lib/services/usage";
import { buildFieldRipple } from "@/lib/services/fieldRipple";
import { buildObjectRipple } from "@/lib/services/objectRipple";
import { type ReactFlowInstance, useReactFlow } from "@xyflow/react";
import {
  centerOnNodeIfNeeded,
  computeDagreLayoutWithNodeSizes,
} from "@/lib/flow/layout";
import { toNodeId } from "@/lib/deps/types";
import type { Edge as DepEdge, NodeRef } from "@/lib/deps/types";
import type { AppNode, EntityKind, RippleNodeData } from "@/lib/types";
import type { Node as RFNode } from "@xyflow/react";

const DEFAULT_NODE_WIDTH = 220;
const DEFAULT_NODE_HEIGHT = 48;
const DEFAULT_RANK_SEP = 360;
const DEFAULT_NODE_SEP = 200;
const DEFAULT_EDGE_SEP = 60;
const POSITION_CHANGE_THRESHOLD = 1;
const LAYOUT_DEBOUNCE_MS = 50;

interface FlowData {
  nodes: Array<{ id: string }>;
  edges: Array<{ source: string; target: string }>;
}

interface MeasuredLayoutProps {
  flow: FlowData;
  measuredPositions: Map<string, { x: number; y: number }>;
  onPositions: (pos: Map<string, { x: number; y: number }>) => void;
  layoutVersion: string;
}

// Helper to create stable flow signature for memoization
function createFlowSignature(flow: FlowData) {
  return {
    nodeCount: flow.nodes.length,
    edgeCount: flow.edges.length,
    nodeIds: flow.nodes
      .map((n) => String(n.id))
      .sort()
      .join("|"),
    edgeIds: flow.edges
      .map((e) => `${e.source}→${e.target}`)
      .sort()
      .join("|"),
  };
}

// Helper to check if positions maps are equal
function arePositionsEqual(
  a: Map<string, { x: number; y: number }>,
  b: Map<string, { x: number; y: number }>,
  threshold = POSITION_CHANGE_THRESHOLD
): boolean {
  if (a.size !== b.size) return false;

  for (const [id, posA] of a) {
    const posB = b.get(id);
    if (!posB || Math.hypot(posA.x - posB.x, posA.y - posB.y) > threshold) {
      return false;
    }
  }
  return true;
}

export function useGraphFlow() {
  const {
    applicationId,
    apiKey,
    graph,
    setGraph,
    root,
    direction,
    peerDepth,
    groupCollapsed,
    minScore,
  } = useGraphStore();

  const { data, error } = useKnackGraph(applicationId, apiKey);

  // Stable predicate that changes identity when collapse map changes
  const isGroupCollapsedFn = useCallback(
    (rootRef: NodeRef, type: EntityKind) => {
      const key = `${toNodeId(rootRef)}::${type}`;
      return (groupCollapsed?.[key] ?? true) as boolean;
    },
    [groupCollapsed]
  );

  // Sync graph data with stable comparison
  useEffect(() => {
    if (data && data !== graph) {
      setGraph(data);
    }
  }, [data, graph, setGraph]);

  // Memoize flow computation with all stable dependencies
  const flow = useMemo(() => {
    if (!graph || !root) return { nodes: [], edges: [] };

    // Treat peer dependencies as default: render full ripple by default
    const depth = Number.isFinite(peerDepth) ? peerDepth : Infinity;

    // Build ripple-focused subgraph depending on root type
    let sg;
    if (root.type === "field") {
      sg = buildFieldRipple(graph, String(root.key), {
        includeEdgeTypes: undefined,
        // Use shared policy for ripple building exclusions
        excludeEdgeTypes: ["displays", "contains", "sortsBy"],
        maxDepth: depth,
      });
    } else if (root.type === "object") {
      sg = buildObjectRipple(graph, String(root.key), {
        includeEdgeTypes: undefined,
        // Use shared policy for ripple building exclusions
        excludeEdgeTypes: ["displays", "contains", "sortsBy"],
        maxDepth: depth,
      });
    } else {
      sg = buildNeighborhoodSubgraph(graph, root, direction, {
        peerDepth: depth,
      });
    }

    const ripplePreferred = root.type === "field" || root.type === "object";
    if (ripplePreferred) {
      // Build initial flow
      const flow = toRippleFlowSimple(graph, sg, "LR", root);
      // Filter nodes/edges below minScore, but always keep root
      const rootId = toNodeId(root);
      const keep = new Set(
        flow.nodes
          .filter((n) => {
            if (String(n.id) === rootId) return true;
            if (n.type === "ripple") {
              const data = n.data as Record<string, unknown>;
              const score =
                typeof data?.score === "number" ? (data.score as number) : 0;
              return score >= minScore;
            }
            return true;
          })
          .map((n) => String(n.id))
      );
      let nodes = flow.nodes.filter((n) => keep.has(String(n.id)));
      const edges = flow.edges.filter(
        (e) => keep.has(String(e.source)) && keep.has(String(e.target))
      );

      // Recompute root score dynamically from kept neighbors for objects
      if (root.type === "object") {
        const fieldNeighborIds = new Set(
          edges
            .filter(
              (e) =>
                e.source === rootId && String(e.target).startsWith("field:")
            )
            .map((e) => String(e.target))
        );
        const scoreById = new Map<string, number>();
        for (const n of nodes) {
          if (n.type !== "ripple") continue;
          const data = n.data as Record<string, unknown>;
          const s =
            typeof data?.score === "number" ? (data.score as number) : 0;
          scoreById.set(String(n.id), s);
        }
        let sum = 0;
        for (const fid of fieldNeighborIds) sum += scoreById.get(fid) ?? 0;
        nodes = nodes.map((n) => {
          if (String(n.id) !== rootId || n.type !== "ripple") return n;
          const data = n.data as Record<string, unknown>;
          return {
            ...n,
            data: {
              ...(data as object),
              // preserve required fields for RippleNodeData
              label: data.label,
              entityKind: data.entityKind,
              isRoot: true,
              score: sum,
            },
          } as typeof n;
        });
      }

      // Recompute positions for the filtered subgraph
      const keptIdSet = new Set(nodes.map((n) => String(n.id)));
      const filteredSubgraph = {
        nodes: sg.nodes.filter((n) => keptIdSet.has(toNodeId(n))),
        edges: sg.edges.filter(
          (e) =>
            keptIdSet.has(toNodeId(e.from)) && keptIdSet.has(toNodeId(e.to))
        ),
      };
      console.log("[layout:use-graph-flow] Calling computeRipplePositions", {
        rootId: toNodeId(root),
        rootType: root.type,
        filteredNodeCount: filteredSubgraph.nodes.length,
        filteredEdgeCount: filteredSubgraph.edges.length,
        spacing: {
          rankSep: DEFAULT_RANK_SEP,
          nodeSep: DEFAULT_NODE_SEP,
          bandSep: DEFAULT_EDGE_SEP * 2,
        },
      });
      
      const recomputedPositions = computeRipplePositions(
        graph,
        filteredSubgraph,
        root,
        "LR",
        {
          rankSep: DEFAULT_RANK_SEP,
          nodeSep: DEFAULT_NODE_SEP,
          bandSep: DEFAULT_EDGE_SEP * 2,
        }
      );
      
      console.log("[layout:use-graph-flow] Received positions from computeRipplePositions", {
        positionCount: recomputedPositions.size,
        samplePositions: Array.from(recomputedPositions.entries())
          .slice(0, 10)
          .map(([id, pos]) => ({ id, x: pos.x.toFixed(1), y: pos.y.toFixed(1) })),
      });
      const recomputedFlow = toRippleFlowWithPositions(
        graph,
        filteredSubgraph,
        recomputedPositions,
        "LR",
        root
      );
      // Merge dynamic root score back into recomputed flow
      function isRippleNode(node: AppNode): node is RFNode<RippleNodeData> {
        return node.type === "ripple";
      }

      const recomputedNodes = recomputedFlow.nodes.map((n) => {
        if (String(n.id) !== rootId || n.type !== "ripple") return n;
        const data = n.data as RippleNodeData;
        const existingRoot = nodes.find((k) => String(k.id) === rootId);
        const score =
          existingRoot && isRippleNode(existingRoot)
            ? existingRoot.data.score
            : data.score;
        return {
          ...n,
          data: {
            ...data,
            isRoot: true,
            score,
          },
        } as typeof n;
      });
      return { nodes: recomputedNodes, edges: recomputedFlow.edges };
    }

    const positions = computeDagreLayoutForSubgraph(
      sg,
      "LR",
      { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT },
      {
        rankSep: DEFAULT_RANK_SEP,
        nodeSep: DEFAULT_NODE_SEP,
        edgeSep: DEFAULT_EDGE_SEP,
      }
    );
    return toGroupedFlow(sg, positions, root, "LR", isGroupCollapsedFn);
  }, [graph, root, direction, peerDepth, isGroupCollapsedFn, minScore]);

  return {
    flow,
    error,
    graph,
  };
}

export function useGraphSelection() {
  const {
    selected,
    setSelected,
    setSelectedEdge,
    selectedEdge,
    setFocusNodeId,
    focusNodeId,
    graph,
  } = useGraphStore();

  // Memoize active node ID computation
  const activeNodeId = useMemo(() => {
    if (selected) return toNodeId(selected);
    return focusNodeId;
  }, [selected, focusNodeId]);

  // Stable node click handler
  const handleNodeClick = useCallback(
    (_: unknown, node: { id: string; type?: string | null }) => {
      if (node.type === "groupNode") return;

      const parts = String(node.id).split(":");
      if (parts.length === 2) {
        const n = graph?.getNode(String(node.id));
        setSelected({
          type: parts[0] as EntityKind,
          key: parts[1],
          name: n?.name,
        });
        setFocusNodeId(String(node.id));
      }
    },
    [graph, setSelected, setFocusNodeId]
  );

  // Stable edge click handler
  const handleEdgeClick = useCallback(
    (_: unknown, edge: { data?: { dep?: unknown } }) => {
      const dep = edge.data?.dep;
      if (dep) setSelectedEdge(dep as DepEdge);
    },
    [setSelectedEdge]
  );

  return {
    activeNodeId,
    selected,
    selectedEdge,
    handleNodeClick,
    handleEdgeClick,
  };
}

export function useGraphLayout() {
  const [measuredPositions, setMeasuredPositions] = useState<
    Map<string, { x: number; y: number }>
  >(new Map());

  // Stable update function with change detection
  const updatePositions = useCallback(
    (positions: Map<string, { x: number; y: number }>) => {
      setMeasuredPositions((prev) => {
        // Only update if positions actually changed
        if (arePositionsEqual(prev, positions)) {
          return prev; // Same reference to prevent downstream re-renders
        }
        return new Map(positions); // Create new Map to ensure fresh reference
      });
    },
    []
  );

  return {
    measuredPositions,
    updatePositions,
  };
}

export function useGraphNodes(
  nodes: AppNode[],
  activeNodeId: string | null | undefined,
  measuredPositions: Map<string, { x: number; y: number }>
) {
  return useMemo(() => {
    if (!nodes.length) return nodes;

    const activeId = String(activeNodeId ?? "");

    return nodes.map((n) => {
      const nodeId = String(n.id);
      const position = measuredPositions.get(nodeId) ?? n.position;
      const isActive = nodeId === activeId;

      return {
        ...n,
        position,
        selected: isActive,
      };
    });
  }, [nodes, activeNodeId, measuredPositions]);
}

export function useGraphCentering(
  nodes: AppNode[],
  focusNodeId: string | undefined
) {
  const rfRef = useRef<ReactFlowInstance | null>(null);
  const lastPositionsRef = useRef<Map<string, { x: number; y: number }>>(
    new Map()
  );

  useEffect(() => {
    if (!rfRef.current) return;

    centerOnNodeIfNeeded({
      flowNodes: nodes,
      focusNodeId,
      rfRef,
      lastPositionsRef,
    });
  }, [nodes, focusNodeId]);

  return { rfRef };
}

export function MeasuredLayout({
  flow,
  measuredPositions,
  onPositions,
  layoutVersion,
}: MeasuredLayoutProps) {
  const rf = useReactFlow();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastComputedRef = useRef<Map<string, { x: number; y: number }>>(
    new Map()
  );

  const flowSignature = useMemo(() => createFlowSignature(flow), [flow]);

  const nodeSizes = useMemo(() => {
    const internal = rf.getNodes?.() ?? [];
    if (!internal.length) return null;

    if (flowSignature.nodeCount === 0) return null;

    const sizeById = new Map<string, { width: number; height: number }>();

    for (const n of internal) {
      const nodeId = String(n.id);
      if (!flowSignature.nodeIds.includes(nodeId)) continue;

      const w =
        typeof n.measured?.width === "number" ? n.measured.width : n.width;
      const h =
        typeof n.measured?.height === "number" ? n.measured.height : n.height;

      if (typeof w === "number" && typeof h === "number" && w > 0 && h > 0) {
        sizeById.set(nodeId, { width: w, height: h });
      }
    }

    return sizeById.size > 0 ? sizeById : null;
  }, [rf, flowSignature]);

  // Debounced layout update function
  const debouncedUpdatePositions = useCallback(
    (positions: Map<string, { x: number; y: number }>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (!arePositionsEqual(lastComputedRef.current, positions)) {
          lastComputedRef.current = new Map(positions);
          onPositions(positions);
        }
      }, LAYOUT_DEBOUNCE_MS);
    },
    [onPositions]
  );

  useEffect(() => {
    if (!nodeSizes || nodeSizes.size === 0) return;

    const edgeList = flow.edges.map((e) => ({
      source: e.source,
      target: e.target,
    }));

    const nodeIds = flow.nodes.map((n) => String(n.id));

    try {
      const nextPositions = computeDagreLayoutWithNodeSizes(
        nodeIds,
        edgeList,
        "LR",
        nodeSizes,
        {
          rankSep: DEFAULT_RANK_SEP,
          nodeSep: DEFAULT_NODE_SEP,
          edgeSep: DEFAULT_EDGE_SEP,
        }
      );

      if (!arePositionsEqual(measuredPositions, nextPositions)) {
        debouncedUpdatePositions(nextPositions);
      }
    } catch (error) {
      console.warn("Layout computation failed:", error);
    }
  }, [
    layoutVersion,
    nodeSizes,
    flow.edges,
    flow.nodes,
    measuredPositions,
    debouncedUpdatePositions,
  ]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return null;
}
