import { useMemo, useEffect, useState } from "react";
import type {
  KnackFormRule,
  KnackFormRuleCriteria,
  KnackFormRuleAction,
} from "../../../types/form";
import { Loader2 } from "lucide-react";

interface RulesSequenceProps {
  rules: KnackFormRule[];
  fieldLabels?: Record<string, string>;
}

function generateMermaidDiagram(
  rules: KnackFormRule[],
  fieldLabels: Record<string, string>
): string {
  console.log("Rules:", rules);
  console.log("Field Labels:", fieldLabels);

  const lines: string[] = ["sequenceDiagram", "autonumber"];

  // Group rules by source field
  const ruleGroups = rules.reduce((groups, rule) => {
    rule.criteria.forEach((criterion) => {
      const sourceField = criterion.field;
      if (!groups[sourceField]) {
        groups[sourceField] = [];
      }
      groups[sourceField].push({ criterion, actions: rule.actions });
    });
    return groups;
  }, {} as Record<string, Array<{ criterion: KnackFormRuleCriteria; actions: KnackFormRuleAction[] }>>);

  // Collect and declare participants
  const participants = new Set<string>(["User"]);
  Object.keys(ruleGroups).forEach((sourceField) => {
    participants.add(sourceField);
    ruleGroups[sourceField].forEach(({ actions }) => {
      actions.forEach((action) => participants.add(action.field));
    });
  });

  // Declare participants with labels
  lines.push("participant User");
  [...participants]
    .filter((p) => p !== "User")
    .forEach((p) => {
      const label = fieldLabels[p] || p;
      const escapedLabel = label.replace(/"/g, '\\"');
      lines.push(`participant ${cleanId(p)} as "${escapedLabel}"`);
    });

  // Process each group of rules
  Object.entries(ruleGroups).forEach(([sourceField, groupRules]) => {
    const fieldLabel = fieldLabels[sourceField] || sourceField;

    // Add section header using the field label
    lines.push(`Note over User: ${fieldLabel}`);

    groupRules.forEach(({ criterion, actions }) => {
      const sourceId = cleanId(criterion.field);
      const sourceLabel = fieldLabels[criterion.field] || criterion.field;
      const value =
        criterion.value === "" ? "(blank)" : criterion.value || "(blank)";
      const operatorText =
        criterion.operator === "is blank" ? "is empty" : criterion.operator;

      // User input - using field label
      lines.push(`User->>+${sourceId}: Input "${value}"`);
      lines.push(
        `Note over ${sourceId}: When ${sourceLabel} ${operatorText} "${value}"`
      );

      // Process actions one by one
      actions.forEach((action) => {
        const targetField = cleanId(action.field);
        const targetLabel = fieldLabels[action.field] || action.field;
        const actionText =
          action.action === "hide-show"
            ? "hide"
            : action.action === "show-hide"
            ? "show"
            : action.action;

        lines.push(`${sourceId}->>${targetField}: ${actionText}`);
        lines.push(`Note over ${targetField}: ${targetLabel}: ${actionText}`);
      });

      if (actions.length > 1) {
        lines.push(
          `Note over ${sourceId}: Total: ${actions.length} fields affected`
        );
      }
    });
  });

  return lines.join("\n");
}

// Helper to clean field IDs for Mermaid compatibility
function cleanId(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, "_");
}

export function RulesSequence({ rules, fieldLabels = {} }: RulesSequenceProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const diagram = useMemo(
    () => generateMermaidDiagram(rules, fieldLabels),
    [rules, fieldLabels]
  );

  useEffect(() => {
    let mounted = true;

    async function initializeMermaid() {
      try {
        const mermaid = (await import("mermaid")).default;

        if (!mounted) return;

        mermaid.initialize({
          startOnLoad: true,
          theme: "neutral",
          sequence: {
            diagramMarginX: 50,
            diagramMarginY: 10,
            actorMargin: 50,
            width: 150,
            height: 65,
            boxMargin: 10,
            boxTextMargin: 5,
            noteMargin: 10,
            messageMargin: 35,
            mirrorActors: false,
          },
        });

        await mermaid.run();
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to initialize mermaid:", error);
        setIsLoading(false);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to initialize diagram"
        );
      }
    }

    initializeMermaid();

    return () => {
      mounted = false;
    };
  }, [diagram]);

  if (!rules?.length) {
    return <div className="text-muted-foreground">No sequence to display</div>;
  }

  return (
    <div className="overflow-x-auto relative min-h-[200px] glass-border rounded-md p-4">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-glow-white" />
        </div>
      )}
      {error && (
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-md glass-border">
          Error loading diagram: {error}
        </div>
      )}
      <div className="mermaid" style={{ opacity: isLoading ? 0 : 1 }}>
        {diagram}
      </div>
    </div>
  );
}
