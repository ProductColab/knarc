"use client";
import { Edge } from "@/lib/deps/types";

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
      <pre
        style={{
          whiteSpace: "pre-wrap",
          fontSize: 12,
          background: "#f7f7f7",
          padding: 8,
          borderRadius: 4,
        }}
      >
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
      <pre
        style={{
          whiteSpace: "pre-wrap",
          fontSize: 12,
          background: "#f7f7f7",
          padding: 8,
          borderRadius: 4,
        }}
      >
        {JSON.stringify(value, null, 2)}
      </pre>
    ),
  },
  {
    key: "sort",
    label: "Sort",
    render: (value) => (
      <pre
        style={{
          whiteSpace: "pre-wrap",
          fontSize: 12,
          background: "#f7f7f7",
          padding: 8,
          borderRadius: 4,
        }}
      >
        {JSON.stringify(value, null, 2)}
      </pre>
    ),
  },
  {
    key: "values",
    label: "Concatenation Values",
    render: (value) => (
      <pre
        style={{
          whiteSpace: "pre-wrap",
          fontSize: 12,
          background: "#f7f7f7",
          padding: 8,
          borderRadius: 4,
        }}
      >
        {JSON.stringify(value, null, 2)}
      </pre>
    ),
  },
];

export function UsageEdgeDetailsPanel({ edge }: { edge: Edge }) {
  if (!edge) return null;

  return (
    <div style={{ maxWidth: 420 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Usage Details</div>
      <div style={{ fontSize: 12, marginBottom: 4 }}>
        <div>
          <b>Relation:</b> {edge.type}
        </div>
        {edge.locationPath ? (
          <div>
            <b>Path:</b> {edge.locationPath}
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
            <div style={{ marginTop: 6 }} key={config.key}>
              <div style={{ fontWeight: 600 }}>{config.label}</div>
              {config.render ? config.render(value) : String(value)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
