"use client";
import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { useGraphStore } from "@/lib/store/graphStore";
import { NodeShell } from "./DefaultNode";
import type { GroupNodeData } from "@/lib/types";
import { getEntityNodeClass } from "@/lib/styles/entityStyles";

export type GroupNode = Node<GroupNodeData>;

export const GroupNode = memo(function GroupNode(props: NodeProps<GroupNode>) {
  const data = props.data;
  const { toggleGroupCollapsed, isGroupCollapsed, setFocusNodeId } =
    useGraphStore();
  const collapsed = isGroupCollapsed(data.root, data.groupType);

  return (
    <NodeShell className={getEntityNodeClass(data.groupType)}>
      <Handle type="target" position={props.targetPosition ?? Position.Left} />
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{data.title}</div>
      <div style={{ color: "#666", marginBottom: 6 }}>{data.count} items</div>
      <button
        className="px-2 py-1 text-xs rounded hover:bg-accent hover:text-accent-foreground"
        onClick={(e) => {
          e.stopPropagation();
          setFocusNodeId(String(props.id));
          toggleGroupCollapsed(data.root, data.groupType);
        }}
      >
        {collapsed ? "Expand" : "Collapse"}
      </button>
      <Handle type="source" position={props.sourcePosition ?? Position.Right} />
    </NodeShell>
  );
});
