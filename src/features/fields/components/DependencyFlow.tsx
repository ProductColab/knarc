import {
  ReactFlow,
  Node,
  Edge,
  Background,
  NodeTypes,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  Controls,
  Panel,
} from "@xyflow/react";
import { FieldNode } from "./FieldNode";
import { FieldEdge } from "./FieldEdge";
import { FieldDependencyNode } from "../actions";
import { FieldWithObject } from "@/lib/knack/types/field";
import useAutoLayout from "../hooks/useAutoLayout";
import { useState, useEffect } from "react";
import "@xyflow/react/dist/style.css";
import { LayoutProvider } from "../context/LayoutContext";
import type { SumField } from "@/lib/knack/types/fields/formula"

interface DependencyFlowProps {
  dependencyTree: FieldDependencyNode;
}

const nodeTypes: NodeTypes = {
  fieldNode: FieldNode,
};

const edgeTypes = {
  custom: FieldEdge,
};

type AppEdge = Edge & {
  data?: {
    connectionName?: string;
  };
}

const createNode = (
  field: FieldWithObject,
  position: { x: number; y: number },
  hasDependencies: boolean,
  isDependedUpon: boolean,
  dependencies: FieldDependencyNode[],
  dependents: FieldDependencyNode[] = []
): Node => {
  console.log(
    `📦 Creating node for field "${field.name}" at position (${position.x}, ${position.y})`
  );
  return {
    id: `${field.objectKey}-${field.key}`,
    data: {
      label: field.name,
      type: field.type,
      object: field.objectName,
      hasDependencies,
      isDependedUpon,
      field,
      dependencies: dependencies.map(d => ({
        name: d.field.name,
        type: d.field.type,
        object: d.field.objectName,
      })),
      dependents: dependents.map(d => ({
        name: d.field.name,
        type: d.field.type,
        object: d.field.objectName,
      })),
    },
    position,
    type: "fieldNode",
  };
};

const createEdge = (
  sourceId: string, 
  targetId: string,
  connectionName?: string
): AppEdge => {
  console.log(`🔗 Creating edge from "${sourceId}" to "${targetId}"${connectionName ? ` via ${connectionName}` : ''}`);
  
  return {
    id: `edge-${sourceId}-${targetId}`,
    source: sourceId,
    target: targetId,
    type: "custom",
    animated: true,
    style: { stroke: "hsl(var(--accent))", strokeWidth: 2 },
    data: connectionName ? { connectionName } : undefined
  };
};

function Flow({ dependencyTree }: DependencyFlowProps) {
  console.log("🌳 Rendering Flow with dependency tree:", dependencyTree);
  const reactFlow = useReactFlow();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<AppEdge[]>([]);

  useAutoLayout({
    direction: "TB",
    spacing: [50, 100],
  });

  useEffect(() => {
    console.log("🔄 Initializing nodes and edges");
    const initialNodes: Node[] = [];
    const initialEdges: AppEdge[] = [];

    const processNode = (
      node: FieldDependencyNode, 
      level: number, 
      parentId?: string,
      index: number = 0,
      totalAtLevel: number = 1
    ) => {
      const nodeId = `${node.field.objectKey}-${node.field.key}`;
      
      const y = (2 - level) * 200;
      const x = ((index + 1) * (800 / (totalAtLevel + 1))) - 400;
      
      initialNodes.push(createNode(
        node.field, 
        { x, y },
        node.dependencies.length > 0,
        parentId !== undefined,
        node.dependencies,
        node.dependents
      ));

      if (parentId) {
        // Find the parent node in the tree to get connection info
        const findNode = (tree: FieldDependencyNode, id: string): FieldDependencyNode | undefined => {
          if (`${tree.field.objectKey}-${tree.field.key}` === id) return tree;
          for (const dep of tree.dependencies) {
            const found = findNode(dep, id);
            if (found) return found;
          }
          return undefined;
        };

        const parentNode = findNode(dependencyTree, parentId);
        let connectionName: string | undefined;
        
        if (parentNode?.field.type === 'sum' && (parentNode.field.format as SumField['format']).connection?.key) {
          // Find the connection field name
          const connectionField = node.field.objectName;
          connectionName = connectionField;
        }
        
        initialEdges.push(createEdge(
          nodeId, 
          parentId,
          connectionName
        ));
      }

      const totalDeps = node.dependencies.length;
      
      node.dependencies.forEach((dep, idx) => {
        processNode(dep, level + 1, nodeId, idx, totalDeps);
      });
    };

    processNode(dependencyTree, 0);

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [dependencyTree]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        panOnScroll
        panOnDrag={[1, 2]}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={true}
        preventScrolling={true}
        minZoom={0.1}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        fitViewOptions={{
          padding: 0.5,
          minZoom: 0.1,
          maxZoom: 2,
          duration: 800,
        }}
        defaultEdgeOptions={{
          type: "custom",
          animated: true,
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Panel position="bottom-right">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              padding: "0.5rem",
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.5rem",
            }}
          >
            <Controls showInteractive={true} />
          </div>
        </Panel>
        <Background
          variant={BackgroundVariant.Dots}
          gap={12}
          size={1}
          color="hsl(var(--muted-foreground))"
          className="bg-background"
        />
      </ReactFlow>
    </div>
  );
}

export function DependencyFlow({ dependencyTree }: DependencyFlowProps) {
  return (
    <ReactFlowProvider>
      <LayoutProvider>
        <div style={{ width: "100%", height: "800px" }}>
          <Flow dependencyTree={dependencyTree} />
        </div>
      </LayoutProvider>
    </ReactFlowProvider>
  );
}
