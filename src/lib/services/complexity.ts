import { DependencyGraph } from "@/lib/deps/graph";
import { Edge, EdgeType, NodeRef } from "@/lib/deps/types";
import { getDefaultExclusionsFor, isEdgeAllowed } from "@/lib/services/policy";

export type EntityKind = NodeRef["type"];

export interface ComplexityFeatureContext {
  graph: DependencyGraph;
  node: NodeRef;
  isAllowed: (edge: Edge) => boolean;
}

export interface ComplexityFeature {
  id: string;
  label: string;
  weight: number; // relative importance in final score
  appliesTo: EntityKind[]; // which entity kinds this feature can score
  compute: (ctx: ComplexityFeatureContext) => number; // raw value (e.g., count)
}

export interface ComplexityConfig {
  edgeInclusion?: EdgeType[];
  edgeExclusion?: EdgeType[];
  features: ComplexityFeature[];
  aggregation?: (weightedValues: number[]) => number; // default sum
}

export interface ComplexityBreakdownItem {
  featureId: string;
  label: string;
  raw: number;
  weight: number;
  weighted: number;
}

export interface ComplexityResult {
  node: NodeRef;
  score: number;
  breakdown: ComplexityBreakdownItem[];
}

function defaultAggregate(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function isAllowed(
  edge: Edge,
  include?: EdgeType[],
  exclude?: EdgeType[]
): boolean {
  if (exclude && exclude.includes(edge.type)) return false;
  if (include && include.length > 0 && !include.includes(edge.type))
    return false;
  return true;
}

function getObjectKeyForField(
  graph: DependencyGraph,
  field: NodeRef
): string | undefined {
  if (field.type !== "field") return undefined;
  const incoming = graph.getIncoming(field);
  for (const e of incoming) {
    if (e.type === "contains" && e.from.type === "object") return e.from.key;
  }
  return undefined;
}

export const builtinFeatures: ComplexityFeature[] = [
  {
    id: "field.incoming.derivesFrom",
    label: "Derived-by fields",
    weight: 2,
    appliesTo: ["field"],
    compute: ({ graph, node, isAllowed }) =>
      graph
        .getIncoming(node)
        .filter(
          (e) =>
            e.type === "derivesFrom" && e.from.type === "field" && isAllowed(e)
        ).length,
  },
  {
    id: "field.incoming.crossObjectDerivesFrom",
    label: "Cross-object derived-by fields",
    weight: 3,
    appliesTo: ["field"],
    compute: ({ graph, node, isAllowed }) => {
      const selfObj = getObjectKeyForField(graph, node);
      return graph
        .getIncoming(node)
        .filter((e) => e.type === "derivesFrom" && e.from.type === "field")
        .filter((e) => isAllowed(e))
        .filter((e) => getObjectKeyForField(graph, e.from) !== selfObj).length;
    },
  },
  {
    id: "field.incoming.viewFilters",
    label: "Views filtering by field",
    weight: 1.5,
    appliesTo: ["field"],
    compute: ({ graph, node, isAllowed }) =>
      graph
        .getIncoming(node)
        .filter(
          (e) =>
            e.type === "filtersBy" && e.from.type === "view" && isAllowed(e)
        ).length,
  },
  {
    id: "field.incoming.viewSorts",
    label: "Views sorting by field",
    weight: 0.25,
    appliesTo: ["field"],
    compute: ({ graph, node, isAllowed }) =>
      graph
        .getIncoming(node)
        .filter(
          (e) => e.type === "sortsBy" && e.from.type === "view" && isAllowed(e)
        ).length,
  },
  {
    id: "field.incoming.usedInRules",
    label: "Rules/values using field",
    weight: 1,
    appliesTo: ["field"],
    compute: ({ graph, node, isAllowed }) =>
      graph.getIncoming(node).filter((e) => e.type === "uses" && isAllowed(e))
        .length,
  },
  {
    id: "field.incoming.usedInRecordRules",
    label: "Record rules using field",
    weight: 2.5,
    appliesTo: ["field"],
    compute: ({ graph, node, isAllowed }) =>
      graph
        .getIncoming(node)
        .filter(
          (e) =>
            e.type === "uses" &&
            isAllowed(e) &&
            e.details?.ruleCategory === "record"
        ).length,
  },
  {
    id: "field.incoming.usedInDisplayRules",
    label: "Display rules using field",
    weight: 0.25,
    appliesTo: ["field"],
    compute: ({ graph, node, isAllowed }) =>
      graph
        .getIncoming(node)
        .filter(
          (e) =>
            e.type === "uses" &&
            isAllowed(e) &&
            e.details?.ruleCategory === "display"
        ).length,
  },
  {
    id: "field.incoming.usedInEmailRules",
    label: "Email rules using field",
    weight: 0.5,
    appliesTo: ["field"],
    compute: ({ graph, node, isAllowed }) =>
      graph
        .getIncoming(node)
        .filter(
          (e) =>
            e.type === "uses" &&
            isAllowed(e) &&
            e.details?.ruleCategory === "email"
        ).length,
  },
  {
    id: "field.chainDepth",
    label: "Derivation chain depth",
    weight: 3,
    appliesTo: ["field"],
    compute: ({ graph, node, isAllowed }) => {
      const visited = new Set<string>();
      const stack: Array<{ n: NodeRef; depth: number }> = [
        { n: node, depth: 0 },
      ];
      let max = 0;
      while (stack.length) {
        const { n, depth } = stack.pop()!;
        max = Math.max(max, depth);
        for (const e of graph.getIncoming(n)) {
          if (e.type !== "derivesFrom") continue;
          if (!isAllowed(e)) continue;
          const from = e.from;
          const id = `${from.type}:${from.key}`;
          if (visited.has(id)) continue;
          visited.add(id);
          stack.push({ n: from, depth: depth + 1 });
        }
      }
      return max;
    },
  },
  {
    id: "field.outgoing.crossObjectDerivesFrom",
    label: "Cross-object dependencies",
    weight: 2,
    appliesTo: ["field"],
    compute: ({ graph, node, isAllowed }) => {
      const selfObj = getObjectKeyForField(graph, node);
      return graph
        .getOutgoing(node)
        .filter((e) => e.type === "derivesFrom" && e.to.type === "field")
        .filter((e) => isAllowed(e))
        .filter((e) => getObjectKeyForField(graph, e.to) !== selfObj).length;
    },
  },
  {
    id: "field.outgoing.aggregatesConnections",
    label: "Aggregates over connections",
    weight: 3,
    appliesTo: ["field"],
    compute: ({ graph, node, isAllowed }) =>
      graph
        .getOutgoing(node)
        .filter((e) => e.type === "connectsTo" && e.to.type === "object")
        .filter((e) => isAllowed(e)).length,
  },
  {
    id: "field.weightedChainDepth",
    label: "Weighted chain depth (cross-object heavier)",
    weight: 3.5,
    appliesTo: ["field"],
    compute: ({ graph, node, isAllowed }) => {
      const selfObj = getObjectKeyForField(graph, node);
      const visited = new Set<string>();
      let max = 0;
      const stack: Array<{ n: NodeRef; depth: number }> = [
        { n: node, depth: 0 },
      ];
      while (stack.length) {
        const { n, depth } = stack.pop()!;
        max = Math.max(max, depth);
        for (const e of graph.getIncoming(n)) {
          if (e.type !== "derivesFrom") continue;
          if (!isAllowed(e)) continue;
          const from = e.from;
          const fromObj = getObjectKeyForField(graph, from);
          const step = fromObj && selfObj && fromObj !== selfObj ? 2 : 1;
          const id = `${from.type}:${from.key}`;
          if (visited.has(id)) continue;
          visited.add(id);
          stack.push({ n: from, depth: depth + step });
        }
      }
      return max;
    },
  },
  {
    id: "view.filterCount",
    label: "Filter rules",
    weight: 1,
    appliesTo: ["view"],
    compute: ({ graph, node, isAllowed }) =>
      graph
        .getOutgoing(node)
        .filter((e) => e.type === "filtersBy" && isAllowed(e)).length,
  },
  {
    id: "view.sortCount_disabled",
    label: "Sort rules",
    weight: 0,
    appliesTo: ["view"],
    compute: ({ graph, node, isAllowed }) =>
      graph
        .getOutgoing(node)
        .filter((e) => e.type === "sortsBy" && isAllowed(e) && false).length,
  },
];

export function computeComplexity(
  graph: DependencyGraph,
  node: NodeRef,
  config?: ComplexityConfig
): ComplexityResult {
  const features = config?.features ?? builtinFeatures;
  const applicable = features.filter((f) => f.appliesTo.includes(node.type));

  const defaultExcluded = getDefaultExclusionsFor("complexity");
  const allowedFn = (edge: Edge) =>
    isEdgeAllowed(
      edge,
      { include: config?.edgeInclusion, exclude: config?.edgeExclusion },
      defaultExcluded
    );

  const breakdown: ComplexityBreakdownItem[] = applicable.map((f) => {
    const raw = f.compute({ graph, node, isAllowed: allowedFn });
    const weighted = raw * f.weight;
    return { featureId: f.id, label: f.label, raw, weight: f.weight, weighted };
  });

  const aggregate = config?.aggregation ?? defaultAggregate;
  const score = aggregate(breakdown.map((b) => b.weighted));

  return { node, score, breakdown };
}

export interface ObjectComplexityRollupResult {
  object: NodeRef;
  totalScore: number;
  fieldResults: ComplexityResult[];
}

/**
 * Computes an object's complexity by summing the complexities of all of its fields.
 */
export function computeObjectComplexityRollup(
  graph: DependencyGraph,
  objectKey: string,
  fieldConfig?: ComplexityConfig
): ObjectComplexityRollupResult {
  const objectNode = graph
    .getAllNodes()
    .find((n) => n.type === "object" && n.key === objectKey);
  if (!objectNode)
    return {
      object: { type: "object", key: objectKey },
      totalScore: 0,
      fieldResults: [],
    };

  // Fields contained by this object via "contains" edges
  const fields = graph
    .getOutgoing(objectNode)
    .filter((e) => e.type === "contains" && e.to.type === "field")
    .map((e) => e.to);

  const fieldResults = fields.map((f) =>
    computeComplexity(graph, f, fieldConfig)
  );
  const totalScore = fieldResults.reduce((sum, r) => sum + r.score, 0);

  return { object: objectNode, totalScore, fieldResults };
}
