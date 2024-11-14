import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { KnackConnectionFieldFormat } from "@/lib/knack/types/fields";
import type { KnackFormInput } from "@/lib/knack/types/views";

interface ConnectionInputProps {
  format: KnackConnectionFieldFormat;
  source?: KnackFormInput["source"];
}

export function ConnectionInput({ format }: ConnectionInputProps) {
  return (
    <Select disabled>
      <SelectTrigger>
        <SelectValue placeholder={format.conn_default || "Select..."} />
      </SelectTrigger>
    </Select>
  );
}

export function ConnectionFormat({ format, source }: ConnectionInputProps) {
  const hasDetails =
    source?.type ||
    source?.connection_key ||
    (source?.connections && source.connections.length > 0) ||
    (source?.filters && source.filters.length > 0);

  if (!hasDetails) {
    return (
      <div className="text-sm text-muted-foreground">
        No additional configuration
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Input Type:</span>
        <Badge variant="secondary" className="capitalize">
          {format.input}
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Default Value:</span>
        <Badge variant="secondary" className="capitalize">
          {format.conn_default}
        </Badge>
      </div>

      {source?.type && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Type:</span>
          <Badge variant="secondary">
            {source.type === "user" ? "User Connection" : source.type}
          </Badge>
        </div>
      )}

      {source?.connection_key && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Connection Key:</span>
          <Badge variant="outline">{source.connection_key}</Badge>
        </div>
      )}

      {source?.connections && source.connections.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">
            Field Connections:
          </span>
          <div className="grid gap-2 pl-4">
            {source.connections.map((conn, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Badge variant="secondary">{conn.field.key}</Badge>
                <span>→</span>
                <Badge variant="outline">{conn.source.field.key}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {source?.filters && source.filters.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Filters:</span>
          <div className="grid gap-2 pl-4">
            {source.filters.map((filter, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Badge variant="secondary">{filter.field}</Badge>
                <span>{filter.operator}</span>
                <Badge variant="outline">
                  {formatFilterValue(filter.value)}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatFilterValue(
  value: string | number | boolean | string[] | Date
): string {
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  return String(value);
}
