import { KnackObject } from "@/lib/knack/types/object";
import { KnackField } from "@/lib/knack/types/field";
import {
  isConcatenationField,
  isEquationField,
  isSumField,
} from "@/lib/knack/types/fields/formula";
import { Edge, EdgeType, NodeRef } from "../types";
import { parseEquation } from "../parsers/equation";
import {
  createEdge,
  extractFromCriteria,
  extractFromValues,
  fieldNode,
  objectNode,
  processArray,
} from "./shared";

function createObjectFieldEdge(
  fromField: KnackField,
  toFieldKey: string,
  fieldByKey: Map<string, KnackField>,
  edgeType: EdgeType,
  locationPath: string,
  details?: Record<string, unknown>
): Edge {
  const toField = fieldByKey.get(toFieldKey);
  return createEdge(
    fieldNode(fromField.key, fromField.name),
    fieldNode(toFieldKey, toField?.name),
    edgeType,
    locationPath,
    details
  );
}

function extractFromConnections(
  objNode: NodeRef,
  connections: { key: string; object: string; has: string; belongs_to: string },
  isOutbound: boolean,
  objectIndex: number,
  connectionIndex: number
): Edge {
  const direction = isOutbound ? "outbound" : "inbound";
  const from = isOutbound ? objNode : objectNode(connections.object);
  const to = isOutbound ? objectNode(connections.object) : objNode;

  return createEdge(
    from,
    to,
    "connectsTo",
    `objects[${objectIndex}].connections.${direction}[${connectionIndex}]`,
    {
      key: connections.key,
      has: connections.has,
      belongs_to: connections.belongs_to,
    }
  );
}

function extractFromReferencedFields(
  field: KnackField,
  referencedFields: Record<
    string,
    {
      field_key: string;
      field_name: string;
      object_key: string;
      object_name: string;
    }
  >,
  objectIndex: number,
  fieldIndex: number,
  equation?: string
): Edge[] {
  const edges: Edge[] = [];
  for (const k of Object.keys(referencedFields)) {
    const r = referencedFields[k]!;

    edges.push(
      createEdge(
        fieldNode(field.key, field.name),
        fieldNode(r.field_key, r.field_name),
        "derivesFrom",
        `objects[${objectIndex}].fields[${fieldIndex}].format.referenced_fields.${k}`,
        {
          object_key: r.object_key,
          object_name: r.object_name,
          equation,
        }
      )
    );
  }
  return edges;
}

function extractFromParsedEquation(
  field: KnackField,
  equation: string,
  object: KnackObject,
  fieldByKey: Map<string, KnackField>,
  objectIndex: number,
  fieldIndex: number
): Edge[] {
  const parsed = parseEquation(equation);
  return parsed.referenced.map((r) => {
    const sameObject = !r.object_key || r.object_key === object.key;
    const targetName = sameObject
      ? fieldByKey.get(r.field_key)?.name
      : undefined;

    return createEdge(
      fieldNode(field.key, field.name),
      fieldNode(r.field_key, targetName),
      "derivesFrom",
      `objects[${objectIndex}].fields[${fieldIndex}].format`,
      { object_key: r.object_key, equation }
    );
  });
}

export function extractFromObject(
  object: KnackObject,
  objectIndex: number
): Edge[] {
  const edges: Edge[] = [];
  const objNode = objectNode(object.key, object.name);
  const fieldByKey = new Map<string, KnackField>();

  for (const f of object.fields) {
    fieldByKey.set(f.key, f);
  }

  edges.push(
    ...processArray(
      object.fields,
      `objects[${objectIndex}].fields`,
      (f, i, path) => [
        createEdge(objNode, fieldNode(f.key, f.name), "contains", path),
        ...extractFromField(f, object, fieldByKey, objectIndex, i),
      ]
    )
  );

  if (object.connections) {
    edges.push(
      ...processArray(
        object.connections.outbound,
        `objects[${objectIndex}].connections.outbound`,
        (c, i) => [extractFromConnections(objNode, c, true, objectIndex, i)]
      )
    );

    edges.push(
      ...processArray(
        object.connections.inbound,
        `objects[${objectIndex}].connections.inbound`,
        (c, i) => [extractFromConnections(objNode, c, false, objectIndex, i)]
      )
    );
  }

  if (object.sort) {
    edges.push(
      createEdge(
        objNode,
        fieldNode(object.sort.field),
        "sortsBy",
        `objects[${objectIndex}].sort.field`,
        { order: object.sort.order }
      )
    );
  }

  return edges;
}

export function extractFromField(
  field: KnackField,
  object: KnackObject,
  fieldByKey: Map<string, KnackField>,
  objectIndex: number,
  fieldIndex: number
): Edge[] {
  const edges: Edge[] = [];
  const basePath = `objects[${objectIndex}].fields[${fieldIndex}]`;

  if (isEquationField(field) && field.format) {
    const referenced = field.format.referenced_fields;
    if (referenced) {
      edges.push(
        ...extractFromReferencedFields(
          field,
          referenced,
          objectIndex,
          fieldIndex,
          field.format.equation
        )
      );
    } else {
      const equation = field.format.equation ?? "";
      edges.push(
        ...extractFromParsedEquation(
          field,
          equation,
          object,
          fieldByKey,
          objectIndex,
          fieldIndex
        )
      );
    }
  }

  if (isSumField(field) && field.format) {
    const f = field.format;

    if (f.field?.key) {
      edges.push(
        createObjectFieldEdge(
          field,
          f.field.key,
          fieldByKey,
          "derivesFrom",
          `${basePath}.format.field.key`
        )
      );
    }

    if (f.connection?.key) {
      edges.push(
        createEdge(
          fieldNode(field.key, field.name),
          objectNode(f.connection.key),
          "connectsTo",
          `${basePath}.format.connection.key`
        )
      );
    }
  }

  // Concatenation fields
  if (isConcatenationField(field) && field.format) {
    edges.push(
      ...processArray(
        field.format.values,
        `${basePath}.format.values`,
        (v, i, path) => {
          if (v.type === "field" && v.field) {
            return [
              createObjectFieldEdge(
                field,
                v.field,
                fieldByKey,
                "derivesFrom",
                path,
                {
                  values: field.format!.values,
                }
              ),
            ];
          }
          return [];
        }
      )
    );
  }

  // Field-level conditional rules
  const rules = (field as KnackField).rules ?? [];
  edges.push(
    ...processArray(rules, `${basePath}.rules`, (rule, ri, rulePath) => {
      const ruleEdges: Edge[] = [];
      ruleEdges.push(...extractFromValues(field, rule.values, rulePath));
      ruleEdges.push(...extractFromCriteria(field, rule.criteria, rulePath));
      return ruleEdges;
    })
  );

  return edges;
}
