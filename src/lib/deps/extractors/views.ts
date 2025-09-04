import { KnackScene } from "@/lib/knack/types/scene";
import { KnackView, KnackViewSource } from "@/lib/knack/types/view";
import { KnackFormView } from "@/lib/knack/types/views/form";
import { KnackTableView } from "@/lib/knack/types/views/table";
import { Edge } from "../types";
import {
  Resolvers,
  resolveConnectionTargetObjectKey,
  resolveObjectName,
} from "../resolvers";
import {
  sceneNode,
  viewNode,
  objectNode,
  processArray,
  createFieldEdge,
  extractFromCriteria,
  extractFromValues,
  extractFieldsFromText,
} from "./shared";

export function extractFromScene(
  scene: KnackScene,
  sceneIndex: number
): Edge[] {
  const edges: Edge[] = [];
  const sNode = sceneNode(scene.key, scene.name);

  // Process views
  edges.push(
    ...processArray(
      scene.views,
      `scenes[${sceneIndex}].views`,
      (v, i, path) => [
        {
          from: sNode,
          to: viewNode(v.key, v.name),
          type: "contains",
          locationPath: path,
        },
      ]
    )
  );

  // Process object reference
  if (scene.object) {
    edges.push({
      from: sNode,
      to: objectNode(scene.object),
      type: "uses",
      locationPath: `scenes[${sceneIndex}].object`,
    });
  }

  return edges;
}

function extractFromViewSource(
  source: KnackViewSource | undefined,
  view: KnackView,
  basePath: string,
  resolvers?: Resolvers
): Edge[] {
  if (!source) return [];

  const edges: Edge[] = [];
  const sourcePath = `${basePath}.source`;

  // Object reference
  edges.push({
    from: viewNode(view.key, view.name),
    to: objectNode(source.object, resolveObjectName(resolvers, source.object)),
    type: "uses",
    locationPath: `${sourcePath}.object`,
  });

  // Criteria rules
  if (source.criteria?.rules) {
    edges.push(
      ...processArray(
        source.criteria.rules,
        `${sourcePath}.criteria.rules`,
        (r, i, path) =>
          r.field
            ? [
                createFieldEdge(view, r.field, "filtersBy", `${path}.field`, {
                  operator: r.operator,
                  rule: r,
                }),
              ]
            : []
      )
    );
  }

  // Sort rules
  edges.push(
    ...processArray(source.sort, `${sourcePath}.sort`, (s, i, path) =>
      s.field
        ? [
            createFieldEdge(view, s.field, "sortsBy", `${path}.field`, {
              order: s.order,
              sort: s,
            }),
          ]
        : []
    )
  );

  // Connection
  if (source.connection_key) {
    const finalObjectKey =
      resolveConnectionTargetObjectKey(resolvers, source.connection_key) ||
      source.connection_key;
    edges.push({
      from: viewNode(view.key, view.name),
      to: objectNode(
        finalObjectKey,
        resolveObjectName(resolvers, finalObjectKey)
      ),
      type: "connectsTo",
      locationPath: `${sourcePath}.connection_key`,
      details: { relationship_type: source.relationship_type },
    });
  }

  return edges;
}

function extractFromFormView(view: KnackFormView, basePath: string): Edge[] {
  const edges: Edge[] = [];

  // Process groups/inputs
  edges.push(
    ...processArray(view.groups, `${basePath}.groups`, (g, gi, groupPath) =>
      processArray(g.columns, `${groupPath}.columns`, (col, ci, colPath) =>
        processArray(col.inputs, `${colPath}.inputs`, (input, ii, inputPath) =>
          input.field?.key
            ? [createFieldEdge(view, input.field.key, "displays", inputPath)]
            : []
        )
      )
    )
  );

  // Process rules
  if (view.rules) {
    const rulesPath = `${basePath}.rules`;

    // Field display rules
    edges.push(
      ...processArray(view.rules.fields, `${rulesPath}.fields`, (r, i, path) =>
        r.field
          ? [
              createFieldEdge(view, r.field, "uses", `${path}.field`, {
                operator: r.operator,
                rule: r,
                ruleCategory: "display",
              }),
            ]
          : []
      )
    );

    // Record rules
    edges.push(
      ...processArray(
        view.rules.records,
        `${rulesPath}.records`,
        (rr, i, recordPath) => {
          const recordEdges: Edge[] = [];
          recordEdges.push(
            ...extractFromValues(view, rr.values, recordPath, "record")
          );
          recordEdges.push(
            ...extractFromCriteria(
              view,
              rr.criteria ?? [],
              recordPath,
              "record"
            )
          );
          return recordEdges;
        }
      )
    );

    // Email rules
    edges.push(
      ...processArray(view.rules.emails, `${rulesPath}.emails`, (em, i, path) =>
        typeof em.field === "string"
          ? extractFieldsFromText(view, em.field, `${path}.field`, {
              email: em,
              ruleCategory: "email",
            })
          : []
      )
    );
  }

  return edges;
}

function extractFromTableView(view: KnackTableView, basePath: string): Edge[] {
  const edges: Edge[] = [];

  edges.push(
    ...processArray(view.columns, `${basePath}.columns`, (col, ci, colPath) => {
      const colEdges: Edge[] = [];

      // Field columns
      if (col?.type === "field" && "field" in col && col.field?.key) {
        colEdges.push(
          createFieldEdge(
            view,
            col.field.key,
            "displays",
            `${colPath}.field.key`
          )
        );
      }

      // Action link columns
      if (col?.type === "action_link" && "action_rules" in col) {
        colEdges.push(
          ...processArray(
            col.action_rules,
            `${colPath}.action_rules`,
            (ar, ai, actionPath) => {
              const actionEdges: Edge[] = [];
              actionEdges.push(
                ...extractFromCriteria(view, ar?.criteria, actionPath)
              );

              // Process record rules
              actionEdges.push(
                ...processArray(
                  ar?.record_rules,
                  `${actionPath}.record_rules`,
                  (rr, ri, recordPath) => {
                    const recordEdges: Edge[] = [];
                    recordEdges.push(
                      ...extractFromValues(view, rr?.values, recordPath)
                    );
                    recordEdges.push(
                      ...extractFromCriteria(
                        view,
                        rr?.criteria ?? [],
                        recordPath
                      )
                    );
                    return recordEdges;
                  }
                )
              );

              return actionEdges;
            }
          )
        );
      }

      return colEdges;
    })
  );

  return edges;
}

export function extractFromView(
  view: KnackView,
  sceneIndex: number,
  viewIndex: number,
  resolvers?: Resolvers
): Edge[] {
  const edges: Edge[] = [];
  const basePath = `scenes[${sceneIndex}].views[${viewIndex}]`;

  // Extract from view source if present
  if (view.source) {
    edges.push(
      ...extractFromViewSource(view.source, view, basePath, resolvers)
    );
  }

  // Dispatch by view type
  switch (view.type) {
    case "form":
      edges.push(...extractFromFormView(view, basePath));
      break;
    case "table":
      edges.push(...extractFromTableView(view, basePath));
      break;
    default:
      break;
  }

  return edges;
}
