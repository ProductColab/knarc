import type {
  Edge as FlowEdge,
  Node as FlowNode,
  XYPosition,
  Position,
} from "@xyflow/react";
import { Subgraph } from "@/lib/deps/serialize";
import { Edge as DepEdge, NodeRef, toNodeId } from "@/lib/deps/types";

export interface FlowGraph {
  nodes: FlowNode[];
  edges: AppEdge[];
}

export type AppEdge = FlowEdge<{
  label?: string;
  dep: DepEdge;
}>;

export function toFlow(
  subgraph: Subgraph,
  positions: Map<string, XYPosition>,
  root?: NodeRef,
  direction: "TB" | "BT" | "LR" | "RL" = "TB"
): FlowGraph {
  const isHorizontal = direction === "LR" || direction === "RL";
  const sourcePosition = isHorizontal
    ? direction === "LR"
      ? ("right" as Position)
      : ("left" as Position)
    : direction === "TB"
    ? ("bottom" as Position)
    : ("top" as Position);
  const targetPosition = isHorizontal
    ? direction === "LR"
      ? ("left" as Position)
      : ("right" as Position)
    : direction === "TB"
    ? ("top" as Position)
    : ("bottom" as Position);
  const nodes: FlowNode[] = subgraph.nodes.map((n) => ({
    id: toNodeId(n),
    position: positions.get(toNodeId(n)) ?? { x: 0, y: 0 },
    data: { label: labelFor(n), node: n },
    targetPosition: targetPosition,
    sourcePosition: sourcePosition,
    style: { border: `1px solid ${colorFor(n)}` },
  }));
  try {
    console.table(
      subgraph.edges.map((e) => ({
        from: `${e.from.name ?? e.from.key}`,
        to: `${e.to.name ?? e.to.key}`,
        type: e.type,
        label: describeEdgeRelative(e, root),
      }))
    );
    console.table(
      nodes.map((n) => ({
        id: n.id,
        sx: n.sourcePosition,
        tx: n.targetPosition,
      }))
    );
  } catch {}
  // Deduplicate edges by unique source->target and stack labels
  const grouped = new Map<
    string,
    { source: string; target: string; labels: string[]; edges: DepEdge[] }
  >();
  for (const e of subgraph.edges) {
    const source = toNodeId(e.from);
    const target = toNodeId(e.to);
    const key = `${source}->${target}`;
    const label = describeEdgeRelative(e, root);
    if (!grouped.has(key)) {
      grouped.set(key, { source, target, labels: [label], edges: [e] });
    } else {
      const g = grouped.get(key)!;
      if (!g.labels.includes(label)) g.labels.push(label);
      g.edges.push(e);
    }
  }
  const edges: AppEdge[] = Array.from(grouped.values()).map((g) => ({
    id: `${g.source}->${g.target}`,
    source: g.source,
    target: g.target,
    type: "usage",
    data: { label: g.labels.join("\n"), dep: g.edges[0] },
  }));
  return { nodes, edges };
}

function labelFor(n: NodeRef): string {
  return `${n.type}:${n.name ?? n.key}`;
}

function colorFor(n: NodeRef): string {
  switch (n.type) {
    case "field":
      return "#1f77b4";
    case "object":
      return "#2ca02c";
    case "view":
      return "#ff7f0e";
    case "scene":
      return "#9467bd";
    default:
      return "#999";
  }
}

function describeEdge(e: DepEdge): string {
  const path = e.locationPath ?? "";
  const op =
    typeof e.details?.operator === "string" ? e.details.operator : undefined;
  const ctx = (() => {
    if (path.includes(".source.criteria"))
      return op ? `Filter (${op})` : "Filter";
    if (path.includes(".source.sort")) return "Sort";
    if (path.includes(".groups") && path.includes(".inputs"))
      return "Form Input";
    if (path.includes(".rules.fields"))
      return op ? `Display Rule (${op})` : "Display Rule";
    if (path.includes(".rules.records"))
      return op ? `Record Rule (${op})` : "Record Rule";
    if (path.includes(".rules.emails")) return "Email Rule";
    if (path.includes(".rules.submits")) return "Submit Rule";
    if (path.includes(".format.values")) return "Concatenation";
    if (path.includes(".format.field")) return "Sum";
    if (path.includes(".format")) return "Equation";
    if (path.includes(".connections")) return "Connection";
    if (path.endsWith(".object") || path.includes(".source.object"))
      return "Data Source";
    if (path.includes(".fields")) return "Field List";
    return undefined;
  })();

  const relation = (() => {
    switch (e.type) {
      case "filtersBy":
        return op ? `Filters By (${op})` : "Filters By";
      case "sortsBy":
        return "Sorts By";
      case "displays":
        return "Displays";
      case "derivesFrom":
        return "Derives From";
      case "contains":
        return "Contains";
      case "connectsTo":
        return "Connects To";
      case "uses":
        return "Uses";
      default:
        return e.type;
    }
  })();

  return ctx ? `${relation} · ${ctx}` : relation;
}

function describeEdgeRelative(e: DepEdge, root?: NodeRef): string {
  const base = describeEdge(e);
  if (!root) return base;
  const rid = toNodeId(root);
  const fromId = toNodeId(e.from);
  const toId = toNodeId(e.to);
  if (fromId === rid) {
    // Edge going out from root
    if (e.type === "derivesFrom") return `${base.split(" · ")[1] ?? base}`;
    if (e.type === "filtersBy") return `${base.split(" · ")[1] ?? base}`;
    return base;
  }
  if (toId === rid) {
    // Edge coming into root
    if (e.type === "derivesFrom") return `${base.split(" · ")[1] ?? base}`;
    if (e.type === "filtersBy") return `${base.split(" · ")[1] ?? base}`;
    return `${base}`;
  }
  return base;
}
