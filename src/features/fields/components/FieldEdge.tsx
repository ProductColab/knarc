interface FieldEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

export function FieldEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
}: FieldEdgeProps) {
  return (
    <path
      id={id}
      d={`M ${sourceX},${sourceY} L ${targetX},${targetY}`}
      stroke="hsl(var(--accent))"
      strokeWidth={2}
      fill="none"
      className="react-flow__edge-path"
      style={{
        strokeOpacity: 0.8,
      }}
    />
  );
}
