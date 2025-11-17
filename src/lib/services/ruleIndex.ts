import { DependencyGraph } from "@/lib/deps/graph";
import { Edge, NodeRef, toNodeId } from "@/lib/deps/types";
import { KnackApplication } from "@/lib/knack/types/application";
import { KnackObject } from "@/lib/knack/types/object";
import { KnackView } from "@/lib/knack/types/view";
import { KnackScene } from "@/lib/knack/types/scene";

export type RuleCategory = "record" | "email" | "display";
export type RuleSource = "form" | "table" | "field" | "task";

export interface RuleDescriptor {
  id: string; // unique identifier for this rule instance
  category: RuleCategory;
  source: RuleSource;
  targetField: NodeRef; // the field this rule uses
  origin: NodeRef; // where the rule comes from (view, field, object for tasks)
  locationPath: string; // JSON path in schema
  edge: Edge; // the original edge
  // Additional metadata
  taskName?: string;
  taskSchedule?: unknown;
  viewName?: string;
  viewType?: string;
  sceneName?: string;
  objectName?: string;
  operator?: string;
  ruleType?: string; // "criteria" | "values" | "text"
  // Email-specific content
  emailSubject?: string;
  emailMessage?: string;
  emailFromName?: string;
  emailFromEmail?: string;
  emailRecipients?: unknown[];
  // Record rule values
  recordValues?: unknown[];
  recordCriteria?: unknown[];
}

export interface RuleIndex {
  allRules: RuleDescriptor[];
  byCategory: Map<RuleCategory, RuleDescriptor[]>;
  bySource: Map<RuleSource, RuleDescriptor[]>;
  byField: Map<string, RuleDescriptor[]>; // keyed by field key
}

function getRuleCategory(edge: Edge): RuleCategory | null {
  const category = edge.details?.ruleCategory;
  if (category === "record" || category === "email" || category === "display") {
    return category;
  }
  return null;
}

function getRuleSource(edge: Edge, app: KnackApplication): RuleSource {
  const ruleSource = edge.details?.ruleSource;
  if (ruleSource === "task") return "task";

  // Check if from a view
  if (edge.from.type === "view") {
    // Find the view to determine if it's form or table
    for (const scene of app.scenes ?? []) {
      const view = scene.views?.find((v: KnackView) => v.key === edge.from.key);
      if (view) {
        return view.type === "form" ? "form" : "table";
      }
    }
    return "table"; // default fallback
  }

  if (edge.from.type === "field") return "field";

  return "task"; // fallback
}

function getOriginNode(
  edge: Edge,
  app: KnackApplication
): { node: NodeRef; viewName?: string; viewType?: string; sceneName?: string; objectName?: string } {
  if (edge.from.type === "view") {
    for (const scene of app.scenes ?? []) {
      const view = scene.views?.find((v: KnackView) => v.key === edge.from.key);
      if (view) {
        return {
          node: edge.from,
          viewName: view.name,
          viewType: view.type,
          sceneName: scene.name,
        };
      }
    }
  }

  if (edge.from.type === "object") {
    const obj = app.objects?.find((o: KnackObject) => o.key === edge.from.key);
    return {
      node: edge.from,
      objectName: obj?.name,
    };
  }

  if (edge.from.type === "field") {
    // Find the field's object
    for (const obj of app.objects ?? []) {
      const field = obj.fields?.find((f) => f.key === edge.from.key);
      if (field) {
        return {
          node: edge.from,
          objectName: obj.name,
        };
      }
    }
  }

  return { node: edge.from };
}

export function buildRuleIndex(
  graph: DependencyGraph,
  app: KnackApplication
): RuleIndex {
  const allRules: RuleDescriptor[] = [];
  const byCategory = new Map<RuleCategory, RuleDescriptor[]>();
  const bySource = new Map<RuleSource, RuleDescriptor[]>();
  const byField = new Map<string, RuleDescriptor[]>();

  // Get all edges that represent rules
  const allEdges = graph.getAllEdges();
  for (const edge of allEdges) {
    // Only process "uses" edges that have a ruleCategory
    if (edge.type !== "uses") continue;
    if (edge.to.type !== "field") continue;

    const category = getRuleCategory(edge);
    if (!category) continue;

    const source = getRuleSource(edge, app);
    const originInfo = getOriginNode(edge, app);

    // Extract email content if available
    // Email rules can have the email object nested (form views) or directly (tasks)
    const emailRule = edge.details?.email as
      | {
          email?: {
            message?: string;
            subject?: string;
            from_name?: string;
            from_email?: string;
            recipients?: unknown[];
          };
          message?: string; // tasks have it directly
          subject?: string;
          from_name?: string;
          from_email?: string;
          recipients?: unknown[];
        }
      | undefined;

    // Get email content - check nested first (form views), then direct (tasks)
    const emailContent = emailRule?.email || emailRule;

    // Extract record rule data
    const recordRule = edge.details?.rule as
      | {
          values?: unknown[];
          criteria?: unknown[];
        }
      | undefined;

    const descriptor: RuleDescriptor = {
      id: `${toNodeId(edge.from)}->${toNodeId(edge.to)}:${edge.locationPath}`,
      category,
      source,
      targetField: edge.to,
      origin: originInfo.node,
      locationPath: edge.locationPath ?? "",
      edge,
      taskName: edge.details?.taskName as string | undefined,
      taskSchedule: edge.details?.taskSchedule,
      viewName: originInfo.viewName,
      viewType: originInfo.viewType,
      sceneName: originInfo.sceneName,
      objectName: originInfo.objectName,
      operator: edge.details?.operator as string | undefined,
      ruleType: edge.details?.ruleType as string | undefined,
      emailSubject: emailContent?.subject,
      emailMessage: emailContent?.message,
      emailFromName: emailContent?.from_name,
      emailFromEmail: emailContent?.from_email,
      emailRecipients: emailContent?.recipients,
      recordValues: recordRule?.values,
      recordCriteria: recordRule?.criteria,
    };

    allRules.push(descriptor);

    // Index by category
    if (!byCategory.has(category)) {
      byCategory.set(category, []);
    }
    byCategory.get(category)!.push(descriptor);

    // Index by source
    if (!bySource.has(source)) {
      bySource.set(source, []);
    }
    bySource.get(source)!.push(descriptor);

    // Index by field
    const fieldKey = edge.to.key ?? "";
    if (fieldKey) {
      if (!byField.has(fieldKey)) {
        byField.set(fieldKey, []);
      }
      byField.get(fieldKey)!.push(descriptor);
    }
  }

  return {
    allRules,
    byCategory,
    bySource,
    byField,
  };
}

export function filterRules(
  index: RuleIndex,
  options?: {
    category?: RuleCategory;
    source?: RuleSource;
    fieldKey?: string;
  }
): RuleDescriptor[] {
  let rules = index.allRules;

  if (options?.category) {
    rules = rules.filter((r) => r.category === options.category);
  }

  if (options?.source) {
    rules = rules.filter((r) => r.source === options.source);
  }

  if (options?.fieldKey) {
    rules = rules.filter((r) => r.targetField.key === options.fieldKey);
  }

  return rules;
}

export function sortRules(
  rules: RuleDescriptor[],
  sortBy: "field" | "origin" | "category" | "source" = "field"
): RuleDescriptor[] {
  const sorted = [...rules];
  sorted.sort((a, b) => {
    switch (sortBy) {
      case "field":
        return (a.targetField.name || a.targetField.key || "").localeCompare(
          b.targetField.name || b.targetField.key || ""
        );
      case "origin":
        return (a.origin.name || a.origin.key || "").localeCompare(
          b.origin.name || b.origin.key || ""
        );
      case "category":
        return a.category.localeCompare(b.category);
      case "source":
        return a.source.localeCompare(b.source);
      default:
        return 0;
    }
  });
  return sorted;
}

