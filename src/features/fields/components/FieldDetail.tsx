"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  NodeTypes,
  BackgroundVariant,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useDuckDB } from "@/lib/duckdb";
import { useQuery } from "@tanstack/react-query";
import { FieldWithObject } from "@/lib/knack/types/field";
import { getFieldDependencies } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isFormulaField } from "@/lib/knack/types/fields/formula";
import { FieldNode } from "./FieldNode";
import { FieldEdge } from "./FieldEdge";
import { FieldDetailCard } from "./FieldDetailCard";

interface FieldDetailProps {
  field: FieldWithObject;
  configId: number;
}

// Node types configuration
const nodeTypes: NodeTypes = {
  fieldNode: FieldNode,
};

// Edge types configuration
const edgeTypes = {
  custom: FieldEdge,
};

export function FieldDetail({ field, configId }: FieldDetailProps) {
  const { getConnection } = useDuckDB();

  const { data: dependencies } = useQuery({
    queryKey: ["field-dependencies", configId, field.objectKey, field.key],
    queryFn: async () => {
      const conn = await getConnection();
      return await getFieldDependencies(
        conn,
        configId,
        field.objectKey,
        field.key
      );
    },
    enabled: isFormulaField(field),
  });

  const { nodes, edges } = useMemo(() => {
    if (!dependencies) {
      return { nodes: [], edges: [] };
    }

    // Root node (formula field) at the top
    const rootNode: Node = {
      id: `${field.objectKey}-${field.key}`,
      data: {
        label: field.name,
        type: field.type,
        object: field.objectName,
      },
      position: { x: 0, y: 0 },
      type: "fieldNode",
      sourcePosition: Position.Bottom,
    };

    // Calculate positions for dependency nodes
    const depNodes: Node[] = dependencies.targetFields.map((dep, index) => {
      const totalWidth = 400;
      const verticalSpacing = 120;
      const xPos =
        (index * totalWidth) / (dependencies.targetFields.length - 1) -
        totalWidth / 2;
      const x = dependencies.targetFields.length === 1 ? 0 : xPos;

      return {
        id: `${dep.objectKey}-${dep.key}`,
        data: {
          label: dep.name,
          type: dep.type,
          object: dep.objectName,
        },
        position: {
          x: x,
          y: verticalSpacing,
        },
        type: "fieldNode",
        targetPosition: Position.Top,
      };
    });

    const nodes = [rootNode, ...depNodes];

    const edges: Edge[] = dependencies.targetFields.map((dep) => ({
      id: `edge-${field.key}-${dep.key}`,
      source: `${field.objectKey}-${field.key}`,
      target: `${dep.objectKey}-${dep.key}`,
      type: "custom",
      animated: true,
      style: { stroke: "hsl(var(--accent))", strokeWidth: 2 },
    }));

    return { nodes, edges };
  }, [dependencies, field]);

  return (
    <div className="space-y-4">
      <FieldDetailCard field={field} />

      {isFormulaField(field) && (
        <Card>
          <CardHeader>
            <CardTitle>Dependencies</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              style={{ width: "100%", height: "400px" }}
              className="border rounded-md bg-background"
            >
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                fitViewOptions={{
                  padding: 0.2,
                  minZoom: 0.5,
                  maxZoom: 1.5,
                }}
                defaultEdgeOptions={{
                  type: "custom",
                  animated: true,
                }}
                style={{ background: "hsl(var(--background))" }}
              >
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={12}
                  size={1}
                  color="hsl(var(--muted-foreground))"
                />
              </ReactFlow>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
