import { KnackActionRuleCriterion, KnackView } from "@/lib/knack/types/view";
import { Edge, EdgeType, NodeRef } from "../types";
import { RuleValue } from "@/lib/knack/rule";
import { KnackField } from "@/lib/knack/types/field";

export function sceneNode(key: string, name?: string): NodeRef {
  return { type: "scene", key, name };
}
export function viewNode(key: string, name?: string): NodeRef {
  return { type: "view", key, name };
}
export function objectNode(key: string, name?: string): NodeRef {
  return { type: "object", key, name };
}
export function fieldNode(key: string, name?: string): NodeRef {
  return { type: "field", key, name };
}

export function processArray<T>(
  array: T[] | undefined,
  basePath: string,
  processor: (item: T, index: number, path: string) => Edge[]
): Edge[] {
  if (!array) return [];
  const edges: Edge[] = [];
  for (let i = 0; i < array.length; i++) {
    const path = `${basePath}[${i}]`;
    edges.push(...processor(array[i], i, path));
  }
  return edges;
}

export function createEdge(
  from: NodeRef,
  to: NodeRef,
  type: EdgeType,
  locationPath: string,
  details?: Record<string, unknown>
): Edge {
  return { from, to, type, locationPath, details };
}

export function createViewEdge(
  view: KnackView,
  edgeType: EdgeType,
  to: NodeRef,
  locationPath: string,
  details?: Record<string, unknown>
): Edge {
  return createEdge(
    viewNode(view.key, view.name),
    to,
    edgeType,
    locationPath,
    details
  );
}

// Fix: Accepts either KnackView or KnackField, and uses the correct node creator for each
export function createFieldEdge(
  entity: KnackView | KnackField,
  fieldKey: string,
  edgeType: EdgeType,
  locationPath: string,
  details?: Record<string, unknown>
): Edge {
  // Determine if entity is a KnackView or KnackField by checking for 'rules' (KnackField) or 'scenes' (KnackView)
  // But more robust: check for 'object' property (KnackField) or 'scene' property (KnackView)
  if ("object" in entity) {
    // KnackField
    return createEdge(
      fieldNode(entity.key, entity.name),
      fieldNode(fieldKey),
      edgeType,
      locationPath,
      details
    );
  } else {
    // KnackView
    return createEdge(
      viewNode(entity.key, entity.name),
      fieldNode(fieldKey),
      edgeType,
      locationPath,
      details
    );
  }
}

export function extractFromCriteria(
  entity: KnackView | KnackField,
  criteria: KnackActionRuleCriterion[] | undefined,
  basePath: string
): Edge[] {
  return processArray(criteria, `${basePath}.criteria`, (c, i, path) => {
    return c?.field
      ? [
          createFieldEdge(entity, c.field, "uses", `${path}.field`, {
            operator: c.operator,
            criterion: c,
          }),
        ]
      : [];
  });
}

export function extractFromValues(
  entity: KnackView | KnackField,
  values: RuleValue[] | undefined,
  basePath: string
): Edge[] {
  return processArray(values, `${basePath}.values`, (val, i, path) => {
    return val?.field
      ? [
          createFieldEdge(entity, val.field, "uses", `${path}.field`, {
            value: val,
          }),
        ]
      : [];
  });
}

export function extractFieldsFromText(
  entity: KnackView | KnackField,
  text: string,
  basePath: string,
  details?: Record<string, unknown>
): Edge[] {
  const matches = text.match(/field_\d+/g) ?? [];
  return matches.map((fieldKey) =>
    createFieldEdge(entity, fieldKey, "uses", basePath, details)
  );
}
