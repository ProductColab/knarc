"use client";
import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { NodeShell } from "./DefaultNode";
import type { EntityNodeData } from "@/lib/types";
import { getEntityNodeClass } from "@/lib/styles/entityStyles";

export type EntityNode = Node<EntityNodeData>;

export const EntityNode = memo(function EntityNode(
  props: NodeProps<EntityNode>
) {
  const { data, targetPosition, sourcePosition } = props;
  return (
    <NodeShell className={getEntityNodeClass(data?.entityKind)}>
      <Handle type="target" position={targetPosition ?? Position.Left} />
      {data?.label}
      <Handle type="source" position={sourcePosition ?? Position.Right} />
    </NodeShell>
  );
});
