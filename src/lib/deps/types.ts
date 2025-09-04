import type { EntityKind } from "../types";

export type EdgeType =
  | "contains" // containment relationship (object->field, scene->view)
  | "uses" // generic usage (view->field)
  | "displays" // specifically display binding (view->field)
  | "filtersBy" // filter rule dependency (view->field)
  | "sortsBy" // sort rule dependency (object/view->field)
  | "derivesFrom" // formula/rollup/concatenation dependency (field->field)
  | "connectsTo"; // relationship dependency (object->object or field->object)

export interface NodeRef {
  type: EntityKind;
  key: string | undefined; // canonical key from Knack (e.g., object_1, field_23, view_5)
  name?: string;
}

export interface EdgeMetaDetails {
  // free-form details to explain the relationship
  [key: string]: unknown;
  equation?: string;
  rule?: unknown;
  sort?: unknown;
  values?: unknown;
}

export interface Edge {
  from: NodeRef;
  to: NodeRef;
  type: EdgeType;
  locationPath?: string; // JSON pointer-like path within application.json
  details?: EdgeMetaDetails;
}

export interface GraphInitOptions {
  derivesEdgeTypes?: EdgeType[];
}

export function toNodeId(node: NodeRef): string {
  return `${node.type}:${node.key}`;
}
