"use client";
import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  type ReactFlowInstance,
} from "@xyflow/react";
import { UsageAccordion } from "@/components/UsageAccordion";
import { UsageEdge } from "@/components/edges/UsageEdge";
import { useKnackApplication } from "@/lib/hooks/use-knack";
import { useGraphStore } from "@/lib/store/graphStore";
import "@xyflow/react/dist/style.css";
import { UsageEdgeDetailsPanel } from "./UsageEdgeDetailsPanel";
import { GroupNode as GroupNodeComp } from "@/components/GroupNode";
import { EntityNode as EntityNodeComp } from "@/components/EntityNode";
import { RippleNode } from "@/components/RippleNode";
import {
  useGraphFlow,
  useGraphSelection,
  useGraphLayout,
  useGraphNodes,
  useGraphCentering,
  MeasuredLayout,
} from "@/lib/flow/use-graph-flow";
import { AppEdge } from "@/lib/flow/adapter";
import { AppNode } from "@/lib/types";
import { EntityDetails } from "./EntityDetails";

export function GraphCanvas() {
  const { applicationId, apiKey, focusNodeId } = useGraphStore();
  const { flow, error } = useGraphFlow();
  const {
    selected,
    selectedEdge,
    handleNodeClick,
    handleEdgeClick,
    activeNodeId,
  } = useGraphSelection();
  const { measuredPositions, updatePositions } = useGraphLayout();
  const nodesWithActive = useGraphNodes(
    flow.nodes,
    activeNodeId,
    measuredPositions
  );
  const { rfRef } = useGraphCentering(nodesWithActive, focusNodeId);
  const appQuery = useKnackApplication(applicationId, apiKey);

  const nodeTypes = useMemo(
    () => ({
      groupNode: GroupNodeComp,
      entity: EntityNodeComp,
      ripple: RippleNode,
    }),
    []
  );
  const edgeTypes = useMemo(() => ({ usage: UsageEdge }), []);

  const layoutVersion = useMemo(() => {
    const nodeIds = flow.nodes
      .map((n) => String(n.id))
      .sort()
      .join("|");
    const edgePairs = flow.edges
      .map((e) => `${e.source}->${e.target}`)
      .sort()
      .join("|");
    return `${nodeIds}#${edgePairs}`;
  }, [flow.nodes, flow.edges]);

  const handleInit = useCallback(
    (instance: ReactFlowInstance<AppNode, AppEdge>) => {
      (
        rfRef as React.RefObject<ReactFlowInstance<AppNode, AppEdge> | null>
      ).current = instance;
    },
    [rfRef]
  );

  const errorElement = error ? <div>Error: {error.message}</div> : null;

  return (
    <div style={{ width: "100%", height: "100%" }}>
      {errorElement ? (
        errorElement
      ) : (
        <ReactFlow
          nodes={nodesWithActive}
          edges={flow.edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onInit={handleInit}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onlyRenderVisibleElements
          fitView
        >
          <MeasuredLayout
            flow={{ nodes: flow.nodes, edges: flow.edges }}
            measuredPositions={measuredPositions}
            onPositions={updatePositions}
            layoutVersion={layoutVersion}
          />
          <MiniMap pannable={false} zoomable={false} />
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
              <EntityDetails selected={selected} appQuery={appQuery} />
            </Panel>
          ) : null}
          <Background gap={16} />
        </ReactFlow>
      )}
    </div>
  );
}
