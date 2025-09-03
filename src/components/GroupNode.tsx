"use client";
import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { useGraphStore } from "@/lib/store/graphStore";
import { NodeRef } from "@/lib/deps/types";

export interface GroupNodeData {
  title: string;
  count: number;
  root: NodeRef;
  groupType: "view" | "field" | "object" | "scene";
}

export const GroupNode = memo(function GroupNode(props: NodeProps) {
  const data = props.data as unknown as GroupNodeData;
  const { toggleGroupCollapsed, isGroupCollapsed } = useGraphStore();
  const collapsed = isGroupCollapsed(data.root, data.groupType);
  return (
    <div
      style={{
        border: "1px solid #999",
        background: "#f9f9f9",
        borderRadius: 6,
        padding: 8,
        fontSize: 12,
        minWidth: 160,
        textAlign: "center",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{data.title}</div>
      <div style={{ color: "#666", marginBottom: 6 }}>{data.count} items</div>
      <button
        className="px-2 py-1 text-xs border rounded"
        onClick={(e) => {
          e.stopPropagation();
          toggleGroupCollapsed(data.root, data.groupType);
        }}
      >
        {collapsed ? "Expand" : "Collapse"}
      </button>
    </div>
  );
});
