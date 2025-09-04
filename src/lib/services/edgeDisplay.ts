import { toNodeId, type Edge } from "@/lib/deps/types";
import { getDefaultExclusionsFor, isEdgeAllowed } from "@/lib/services/policy";

// Single source of truth for which edges are rendered in Ripple views
export function isEdgeDisplayedInRipple(edge: Edge): boolean {
  const defaults = getDefaultExclusionsFor("rippleDisplay");
  return isEdgeAllowed(edge, undefined, defaults);
}

// Determine how an edge should be drawn in Ripple view.
// We invert certain dependencies to reflect "impact" (field → view) instead of
// the underlying dependency model (dependent → dependency).
export function getDisplayedEndpoints(
  edge: Edge,
  rootId?: string
): {
  sourceId: string;
  targetId: string;
} {
  switch (edge.type) {
    case "filtersBy":
    case "sortsBy":
    case "uses": {
      // Invert to show impact from field to view/object that references it
      const sourceId = toNodeId(edge.to); // the field
      const targetId = toNodeId(edge.from); // the view/object depending on the field
      return { sourceId, targetId };
    }
    case "derivesFrom": {
      // UI convention: show dependency arrows as derived → dependency
      // so that a derived field emits outgoing edges to its inputs.
      const fromId = toNodeId(edge.from);
      const toId = toNodeId(edge.to);
      const displayed = { sourceId: toId, targetId: fromId };

      // Debug: capture raw vs displayed orientation for sharing in UI logs
      try {
        // Only log when root participates to avoid noise
        if (rootId && (fromId === rootId || toId === rootId)) {
          console.debug("[ripple:endpoints] derivesFrom", {
            rootId,
            raw: { fromId, toId, locationPath: edge.locationPath },
            displayed,
          });
        }
      } catch {}

      return displayed;
    }
    default: {
      // Keep original direction for other edges like derivesFrom, connectsTo, etc.
      return { sourceId: toNodeId(edge.from), targetId: toNodeId(edge.to) };
    }
  }
}

// Root-aware display rule: include 'contains' only when it originates from the root.
export function shouldDisplayEdgeInRipple(
  edge: Edge,
  rootId?: string
): boolean {
  if (edge.type === "contains") {
    if (!rootId) return false;
    return toNodeId(edge.from) === rootId;
  }
  return isEdgeDisplayedInRipple(edge);
}
