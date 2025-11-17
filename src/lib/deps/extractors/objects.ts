import { KnackObject } from "@/lib/knack/types/object";
import { KnackField } from "@/lib/knack/types/field";
import {
  isConcatenationField,
  isEquationField,
  isSumField,
} from "@/lib/knack/types/fields/formula";
import { Edge, EdgeType, NodeRef } from "../types";
import {
  Resolvers,
  resolveConnectionTargetObjectKey,
  resolveObjectName,
} from "../resolvers";
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
  objectIndex: number,
  resolvers?: Resolvers
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
        ...extractFromField(f, object, fieldByKey, objectIndex, i, resolvers),
      ]
    )
  );

  if (object.connections) {
    edges.push(
      ...processArray(
        object.connections.outbound,
        `objects[${objectIndex}].connections.outbound`,
        (c, i) => [
          (() => {
            const targetKey = c.object;
            const targetName = resolveObjectName(resolvers, targetKey);
            const from = objNode;
            const to = objectNode(targetKey, targetName);
            return createEdge(
              from,
              to,
              "connectsTo",
              `objects[${objectIndex}].connections.outbound[${i}]`,
              {
                key: c.key,
                has: c.has,
                belongs_to: c.belongs_to,
              }
            );
          })(),
        ]
      )
    );

    edges.push(
      ...processArray(
        object.connections.inbound,
        `objects[${objectIndex}].connections.inbound`,
        (c, i) => [
          (() => {
            const sourceKey = c.object;
            const sourceName = resolveObjectName(resolvers, sourceKey);
            const from = objectNode(sourceKey, sourceName);
            const to = objNode;
            return createEdge(
              from,
              to,
              "connectsTo",
              `objects[${objectIndex}].connections.inbound[${i}]`,
              {
                key: c.key,
                has: c.has,
                belongs_to: c.belongs_to,
              }
            );
          })(),
        ]
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

  // Extract from tasks
  if (object.tasks) {
    edges.push(
      ...processArray(
        object.tasks,
        `objects[${objectIndex}].tasks`,
        (task, taskIndex, taskPath) => {
          const taskEdges: Edge[] = [];
          const action = task.action;
          if (!action) return taskEdges;

          const ruleCategory =
            action.action === "record"
              ? "record"
              : action.action === "email"
              ? "email"
              : undefined;

          if (ruleCategory) {
            // Extract from criteria - create edges manually since we're working with object
            if (action.criteria) {
              taskEdges.push(
                ...processArray(
                  action.criteria,
                  `${taskPath}.action.criteria`,
                  (c, i, path) => {
                    return c?.field
                      ? [
                          createEdge(
                            objNode,
                            fieldNode(c.field),
                            "uses",
                            `${path}.field`,
                            {
                              operator: c.operator,
                              criterion: c,
                              ruleType: "criteria",
                              ruleCategory: ruleCategory,
                              taskName: task.name,
                              taskKey: task.key,
                              taskSchedule: task.schedule,
                              ruleSource: "task",
                            }
                          ),
                        ]
                      : [];
                  }
                )
              );
            }

            // Extract from values - create edges manually
            if (action.values) {
              taskEdges.push(
                ...processArray(
                  action.values,
                  `${taskPath}.action.values`,
                  (val, i, path) => {
                    return val?.field
                      ? [
                          createEdge(
                            objNode,
                            fieldNode(val.field),
                            "uses",
                            `${path}.field`,
                            {
                              value: val,
                              ruleType: "values",
                              ruleCategory: ruleCategory,
                              taskName: task.name,
                              taskKey: task.key,
                              taskSchedule: task.schedule,
                              ruleSource: "task",
                            }
                          ),
                        ]
                      : [];
                  }
                )
              );
            }

            // Extract from email message (if email action)
            if (action.action === "email" && action.email?.message) {
              const message = String(action.email.message);
              const matches = message.match(/field_\d+/g) ?? [];
              taskEdges.push(
                ...matches.map((fieldKey) =>
                  createEdge(
                    objNode,
                    fieldNode(fieldKey),
                    "uses",
                    `${taskPath}.action.email.message`,
                    {
                      email: action.email,
                      ruleType: "text",
                      ruleCategory: "email",
                      taskName: task.name,
                      taskKey: task.key,
                      taskSchedule: task.schedule,
                      ruleSource: "task",
                    }
                  )
                )
              );
            }

            return taskEdges;
          }

          return taskEdges;
        }
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
  fieldIndex: number,
  resolvers?: Resolvers
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
      const connectionKey = f.connection.key;
      const finalObjectKey =
        resolveConnectionTargetObjectKey(resolvers, connectionKey) ||
        connectionKey;
      const finalObjectName = resolveObjectName(resolvers, finalObjectKey);
      edges.push(
        createEdge(
          fieldNode(field.key, field.name),
          objectNode(finalObjectKey, finalObjectName),
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
