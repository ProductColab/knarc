"use client";
import { useEffect, useMemo } from "react";
import { ReactFlow, Background, Controls, MiniMap, Panel } from "@xyflow/react";
import { UsageAccordion } from "@/components/UsageAccordion";
import { UsageEdge } from "@/components/edges/UsageEdge";
import { useKnackApplication, useKnackGraph } from "@/lib/hooks/use-knack";
import { useGraphStore } from "@/lib/store/graphStore";
import { layoutDagre } from "@/lib/flow/layout";
import { toFlow } from "@/lib/flow/adapter";
import { buildNeighborhoodSubgraph } from "@/lib/services/usage";
import "@xyflow/react/dist/style.css";
import { NodeType } from "@/lib/deps/types";
import { resolveKnackEntity } from "@/lib/knack/entity-resolver";
import { UsageEdgeDetailsPanel } from "./UsageEdgeDetailsPanel";

export function GraphCanvas() {
  const {
    applicationId,
    apiKey,
    graph,
    setGraph,
    root,
    direction,
    peerMode,
    peerDepth,
    selected,
    setSelected,
    setSelectedEdge,
    selectedEdge,
  } = useGraphStore();
  const { data, error } = useKnackGraph(applicationId, apiKey);
  const appQuery = useKnackApplication(applicationId, apiKey);

  useEffect(() => {
    if (data && data !== graph) {
      setGraph(data);
    }
  }, [data, graph, setGraph]);

  const flow = useMemo(() => {
    if (!graph || !root) return { nodes: [], edges: [] };
    const depth = peerMode
      ? Number.isFinite(peerDepth)
        ? peerDepth
        : Infinity
      : 1;
    const sg = buildNeighborhoodSubgraph(graph, root, direction, {
      peerDepth: depth,
    });
    try {
      console.log("[GraphCanvas] root", root, "direction", direction);
      console.table(
        sg.edges.map((e) => ({
          rel: e.type,
          from: `${e.from.type}:${e.from.name ?? e.from.key}`,
          to: `${e.to.type}:${e.to.name ?? e.to.key}`,
          path: e.locationPath,
        }))
      );
    } catch {}
    const positions = layoutDagre(
      sg,
      "RL",
      { width: 220, height: 48 },
      { rankSep: 220, nodeSep: 200, edgeSep: 60 }
    );
    return toFlow(sg, positions, root, "RL");
  }, [graph, root, direction, peerMode, peerDepth]);

  if (error) return <div>Error: {(error as Error).message}</div>;

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={flow.nodes}
        edges={flow.edges}
        edgeTypes={{ usage: UsageEdge }}
        onNodeClick={(_, node) => {
          const parts = String(node.id).split(":");
          if (parts.length === 2) {
            const n = graph?.getNode(String(node.id));
            setSelected({
              type: parts[0] as NodeType,
              key: parts[1],
              name: n?.name,
            });
          }
        }}
        onEdgeClick={(_, edge) => {
          const dep = edge.data?.dep;
          if (dep) setSelectedEdge(dep);
        }}
        fitView
      >
        <MiniMap />
        <Controls />
        <Panel position="top-right">
          <UsageAccordion />
        </Panel>
        {selectedEdge ? (
          <Panel position="bottom-right">
            <UsageEdgeDetailsPanel edge={selectedEdge} />
          </Panel>
        ) : null}
        {selected ? (
          <Panel position="bottom-left">
            <div style={{ maxWidth: 420 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Node Details
              </div>
              <div style={{ fontSize: 12, marginBottom: 4 }}>
                <div>
                  <b>Type:</b> {selected.type}
                </div>
                <div>
                  <b>Key:</b> {selected.key}
                </div>
                {selected.name ? (
                  <div>
                    <b>Name:</b> {selected.name}
                  </div>
                ) : null}
              </div>
              {appQuery.data ? (
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    fontSize: 12,
                    background: "#f7f7f7",
                    padding: 8,
                    borderRadius: 4,
                    maxHeight: 280,
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(
                    resolveKnackEntity(
                      appQuery.data,
                      selected.type,
                      selected.key
                    ),
                    null,
                    2
                  )}
                </pre>
              ) : null}
            </div>
          </Panel>
        ) : null}
        <Background gap={16} />
      </ReactFlow>
    </div>
  );
}
