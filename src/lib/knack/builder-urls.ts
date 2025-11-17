import type { KnackApplication } from "./types/application";
import type { RuleDescriptor } from "@/lib/services/ruleIndex";

/**
 * Build a Knack builder URL for a task
 * Format: https://builder.knack.com/{account_slug}/{app_slug}/tasks/objects/{object_key}/{task_key}/task
 */
export function buildTaskBuilderUrl(
  app: KnackApplication,
  objectKey: string,
  taskKey: string
): string {
  const accountSlug = app.account?.slug || "default";
  const appSlug = app.slug || "default";
  return `https://builder.knack.com/${accountSlug}/${appSlug}/tasks/objects/${objectKey}/${taskKey}/task`;
}

/**
 * Build a Knack builder URL for a view rule
 * Format: https://builder.knack.com/{account_slug}/{app_slug}/pages/{scene_key}/views/{view_key}/{view_type}/{rule_type}
 * 
 * Rule types:
 * - "emails" for email rules
 * - "records" for record rules
 * - "displays" for display rules (if applicable)
 */
export function buildViewRuleBuilderUrl(
  app: KnackApplication,
  sceneKey: string,
  viewKey: string,
  viewType: string,
  ruleCategory: "email" | "record" | "display"
): string {
  const accountSlug = app.account?.slug || "default";
  const appSlug = app.slug || "default";
  
  // Map rule category to URL segment
  // Email rules go to /emails, record and display rules go to /rules
  const ruleType = ruleCategory === "email" ? "emails" : "rules";
  
  return `https://builder.knack.com/${accountSlug}/${appSlug}/pages/${sceneKey}/views/${viewKey}/${viewType}/${ruleType}`;
}

/**
 * Build a Knack builder URL for a rule based on its descriptor
 */
export function buildRuleBuilderUrl(
  app: KnackApplication,
  rule: RuleDescriptor
): string | null {
  // Task-based rules
  if (rule.source === "task" && rule.origin.type === "object") {
    const taskKey = rule.edge.details?.taskKey as string | undefined;
    if (taskKey && rule.origin.key) {
      return buildTaskBuilderUrl(app, rule.origin.key, taskKey);
    }
  }

  // View-based rules
  if (rule.origin.type === "view") {
    // Find the scene that contains this view
    for (const scene of app.scenes ?? []) {
      const view = scene.views?.find((v) => v.key === rule.origin.key);
      if (view) {
        const viewType = rule.viewType || view.type || "form";
        return buildViewRuleBuilderUrl(
          app,
          scene.key,
          rule.origin.key,
          viewType,
          rule.category
        );
      }
    }
  }

  // Field-based rules - try to find if it's from a view's field rules
  if (rule.origin.type === "field") {
    // Field rules might be in views - check if we can find the view
    // This is a best-effort approach since field rules don't always have view context
    for (const scene of app.scenes ?? []) {
      for (const view of scene.views ?? []) {
        // Check if this field is used in view rules
        // This is approximate - we'd need to check the actual rule location
        if (rule.viewName && view.name === rule.viewName) {
          const viewType = rule.viewType || view.type || "form";
          return buildViewRuleBuilderUrl(
            app,
            scene.key,
            view.key,
            viewType,
            rule.category
          );
        }
      }
    }
  }

  return null;
}

