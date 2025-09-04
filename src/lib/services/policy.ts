import type { Edge, EdgeType } from "@/lib/deps/types";

export type EdgePolicyContext = "complexity" | "rippleBuild" | "rippleDisplay";

const DEFAULT_EXCLUDED: Record<EdgePolicyContext, EdgeType[]> = {
  // Sorting does not add operational complexity of a field
  complexity: ["sortsBy"],
  // Do not propagate structural edges in ripple subgraphs; sortsBy also excluded
  rippleBuild: ["displays", "contains", "sortsBy"],
  // Do not render structural containment; hide sorts
  rippleDisplay: ["contains", "sortsBy"],
};

export function getDefaultExclusionsFor(
  context: EdgePolicyContext
): EdgeType[] {
  return DEFAULT_EXCLUDED[context];
}

export function isEdgeAllowed(
  edge: Edge,
  options?: { include?: EdgeType[]; exclude?: EdgeType[] },
  defaults?: EdgeType[]
): boolean {
  const exclude = new Set([...(defaults ?? []), ...(options?.exclude ?? [])]);
  if (exclude.has(edge.type)) return false;
  const include = options?.include;
  if (include && include.length > 0 && !include.includes(edge.type))
    return false;
  return true;
}
