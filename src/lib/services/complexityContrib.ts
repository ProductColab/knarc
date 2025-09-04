import type { Edge, NodeRef } from "@/lib/deps/types";
import type { DependencyGraph } from "@/lib/deps/graph";
import { builtinFeatures } from "@/lib/services/complexity";

function getObjectKeyForField(
  graph: DependencyGraph,
  field: NodeRef
): string | undefined {
  if (field.type !== "field") return undefined;
  for (const e of graph.getIncoming(field)) {
    if (e.type === "contains" && e.from.type === "object") return e.from.key;
  }
  return undefined;
}

export interface FeatureEdgeContribution {
  featureId: string;
  label: string;
  weight: number;
  edges: Edge[];
}

export function describeEdgeShort(e: Edge): string {
  const from = `${e.from.type}:${e.from.key}`;
  const to = `${e.to.type}:${e.to.key}`;
  return `${from} → ${to} · ${e.type}`;
}

export function getFeatureEdgeContributions(
  graph: DependencyGraph,
  node: NodeRef
): FeatureEdgeContribution[] {
  const selfObj =
    node.type === "field" ? getObjectKeyForField(graph, node) : undefined;
  const items: FeatureEdgeContribution[] = [];

  for (const f of builtinFeatures) {
    if (!f.appliesTo.includes(node.type)) continue;

    let edges: Edge[] = [];
    switch (f.id) {
      case "field.incoming.derivesFrom":
        edges = graph
          .getIncoming(node)
          .filter((e) => e.type === "derivesFrom" && e.from.type === "field");
        break;
      case "field.incoming.crossObjectDerivesFrom":
        edges = graph
          .getIncoming(node)
          .filter((e) => e.type === "derivesFrom" && e.from.type === "field")
          .filter((e) => getObjectKeyForField(graph, e.from) !== selfObj);
        break;
      case "field.incoming.viewFilters":
        edges = graph
          .getIncoming(node)
          .filter((e) => e.type === "filtersBy" && e.from.type === "view");
        break;
      case "field.incoming.viewSorts":
        edges = graph
          .getIncoming(node)
          .filter((e) => e.type === "sortsBy" && e.from.type === "view");
        break;
      case "field.incoming.usedInRules":
        edges = graph.getIncoming(node).filter((e) => e.type === "uses");
        break;
      case "field.incoming.usedInRecordRules":
        edges = graph
          .getIncoming(node)
          .filter(
            (e) =>
              e.type === "uses" && (e.details as any)?.ruleCategory === "record"
          );
        break;
      case "field.incoming.usedInDisplayRules":
        edges = graph
          .getIncoming(node)
          .filter(
            (e) =>
              e.type === "uses" &&
              (e.details as any)?.ruleCategory === "display"
          );
        break;
      case "field.incoming.usedInEmailRules":
        edges = graph
          .getIncoming(node)
          .filter(
            (e) =>
              e.type === "uses" && (e.details as any)?.ruleCategory === "email"
          );
        break;
      case "field.outgoing.crossObjectDerivesFrom":
        edges = graph
          .getOutgoing(node)
          .filter((e) => e.type === "derivesFrom" && e.to.type === "field")
          .filter((e) => getObjectKeyForField(graph, e.to) !== selfObj);
        break;
      case "field.outgoing.aggregatesConnections":
        edges = graph
          .getOutgoing(node)
          .filter((e) => e.type === "connectsTo" && e.to.type === "object");
        break;
      case "view.filterCount":
        edges = graph.getOutgoing(node).filter((e) => e.type === "filtersBy");
        break;
      case "view.sortCount":
        edges = graph.getOutgoing(node).filter((e) => e.type === "sortsBy");
        break;
      default:
        edges = [];
        break;
    }

    items.push({ featureId: f.id, label: f.label, weight: f.weight, edges });
  }

  return items;
}
