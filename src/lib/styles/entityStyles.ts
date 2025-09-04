import type { EntityKind } from "@/lib/types";

type StyleConfig = {
  nodeClass: string;
  badgeClass: string;
};

export const entityStyles: Record<EntityKind, StyleConfig> = {
  object: {
    nodeClass: "border-emerald-300 bg-emerald-50",
    badgeClass: "bg-emerald-100 text-emerald-800",
  },
  field: {
    nodeClass: "border-blue-300 bg-blue-50",
    badgeClass: "bg-blue-100 text-blue-800",
  },
  view: {
    nodeClass: "border-violet-300 bg-violet-50",
    badgeClass: "bg-violet-100 text-violet-800",
  },
  scene: {
    nodeClass: "border-amber-300 bg-amber-50",
    badgeClass: "bg-amber-100 text-amber-900",
  },
};

export function getEntityNodeClass(kind?: EntityKind): string {
  return kind ? entityStyles[kind].nodeClass : "";
}

export function getEntityBadgeClass(kind?: EntityKind): string {
  return kind ? entityStyles[kind].badgeClass : "";
}
