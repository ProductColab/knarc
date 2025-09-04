"use client";
import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { RippleNodeData } from "@/lib/types";
import { NodeShell } from "./DefaultNode";
import { getEntityNodeClass } from "@/lib/styles/entityStyles";

export type RippleNode = Node<RippleNodeData>;

export const RippleNode = memo(function RippleNode(
  props: NodeProps<RippleNode>
) {
  const { data, targetPosition, sourcePosition } = props;
  const isRoot = data?.isRoot;
  const animateClass = isRoot ? "" : "animate-[rippleIn_320ms_ease-out_both]";
  return (
    <NodeShell
      className={getEntityNodeClass(data.entityKind) + " " + animateClass}
    >
      <Handle type="target" position={targetPosition ?? Position.Left} />
      <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
        <span
          style={{
            fontSize: 12,
            padding: "2px 6px",
            background: "#f1f5f9",
            color: "#334155",
            borderRadius: 999,
            marginRight: 8,
            textTransform: "capitalize",
            border: isRoot ? "1px solid #0ea5e9" : undefined,
          }}
        >
          {data.entityKind}
        </span>
        <span style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>
          {data.label}
        </span>
      </div>
      <div style={{ fontSize: 12, color: "#475569" }}>
        Complexity: <b>{Math.round((data.score ?? 0) * 10) / 10}</b>
      </div>
      <Handle type="source" position={sourcePosition ?? Position.Right} />
    </NodeShell>
  );
});
