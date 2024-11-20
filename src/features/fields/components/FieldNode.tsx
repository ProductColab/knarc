import { Handle, Position } from "@xyflow/react";
import { Badge } from "@/components/ui/badge";

interface FieldNodeProps {
  data: {
    label: string;
    type: string;
    object: string;
  };
  isConnectable: boolean;
}

export function FieldNode({ data, isConnectable }: FieldNodeProps) {
  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-primary border-2"
      />
      <div className="px-4 py-2 shadow-md rounded-md border bg-background">
        <div className="font-bold">{data.label}</div>
        <div className="text-sm text-muted-foreground">{data.object}</div>
        <Badge variant="secondary" className="mt-1">
          {data.type.replace(/_/g, " ")}
        </Badge>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-primary border-2"
      />
    </>
  );
}
