"use client";
import { Edge } from "@/lib/deps/types";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type DetailConfig = {
  key: string;
  label: string;
  render?: (value: unknown) => React.ReactNode;
  condition?: (edge: Edge) => boolean;
};

const detailConfigs: DetailConfig[] = [
  {
    key: "equation",
    label: "Equation",
    render: (value) => (
      <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded font-mono">
        {String(value)}
      </pre>
    ),
    condition: (edge) =>
      typeof edge.details?.equation === "string" && !!edge.details?.equation,
  },
  {
    key: "rule",
    label: "Rule",
    render: (value) => (
      <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded font-mono">
        {JSON.stringify(value, null, 2)}
      </pre>
    ),
  },
  {
    key: "sort",
    label: "Sort",
    render: (value) => (
      <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded font-mono">
        {JSON.stringify(value, null, 2)}
      </pre>
    ),
  },
  {
    key: "values",
    label: "Concatenation Values",
    render: (value) => (
      <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded font-mono">
        {JSON.stringify(value, null, 2)}
      </pre>
    ),
  },
];

export function UsageEdgeDetailsPanel({ edge }: { edge: Edge }) {
  if (!edge) return null;

  return (
    <Card className="max-w-lg w-full shadow-lg border border-muted-foreground/10">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">
            Usage Details
          </span>
          <Badge variant="secondary" className="ml-auto text-xs px-2 py-0.5">
            {edge.type}
          </Badge>
        </div>
        {edge.locationPath && (
          <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
            <span className="font-medium">Path:</span>
            <span className="truncate">{edge.locationPath}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4 pt-2 pb-4">
        {edge.type === "contains" ? (
          <div className="text-xs text-amber-700">
            Structural containment (object contains field). Excluded from
            performance ripple.
          </div>
        ) : null}
        {detailConfigs.map((config) => {
          const value = edge.details?.[config.key];
          const shouldRender =
            typeof config.condition === "function"
              ? config.condition(edge)
              : value !== undefined && value !== null;
          if (!shouldRender) return null;
          return (
            <div key={config.key}>
              <div className="font-medium text-sm mb-1 text-primary">
                {config.label}
              </div>
              {config.render ? (
                config.render(value)
              ) : (
                <div className="text-xs text-muted-foreground">
                  {String(value)}
                </div>
              )}
            </div>
          );
        })}
        {/* If no details, show a subtle message */}
        {detailConfigs.every((config) => {
          const value = edge.details?.[config.key];
          const shouldRender =
            typeof config.condition === "function"
              ? config.condition(edge)
              : value !== undefined && value !== null;
          return !shouldRender;
        }) && (
          <div className="text-xs text-muted-foreground italic">
            No additional details for this edge.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
