import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import type { AppEdge } from "@/lib/flow/adapter";

export const UsageEdge = memo(function UsageEdge(props: EdgeProps<AppEdge>) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    data,
    selected,
  } = props;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const label = data?.label ?? "";
  const lines = String(label).split("\n");

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
            background: selected ? "#fff3" : "#fff",
            padding: "2px 6px",
            borderRadius: 4,
            fontSize: 10,
            border: "1px solid #ddd",
            color: "#333",
            whiteSpace: "nowrap",
          }}
          title={label as string}
        >
          {lines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});
