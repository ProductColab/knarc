import type {
  KnackFormRule,
  KnackFormRecordRule,
  KnackFormEmailRule,
  KnackFormSubmitRule,
  KnackFormRuleCriteria,
  KnackFormRuleAction,
} from "../types/form";
import type { KnackFormInput, KnackFormView } from "../types/views";

interface FormStory {
  title: string;
  asA: string;
  iWant: string;
  soThat: string;
  acceptanceCriteria: string[];
}

function getFieldLabels(view: KnackFormView): Record<string, string> {
  const labels: Record<string, string> = {};
  view.groups.forEach((group) => {
    group.columns.forEach((column) => {
      column.inputs.forEach((input) => {
        if (input.field?.key) {
          labels[input.field.key] = input.label;
        }
      });
    });
  });
  return labels;
}

type FieldDependency = {
  field: string;
  dependsOn: string[];
  rules: KnackFormRule[];
};

function buildDependencyGraph(
  rules: KnackFormRule[]
): Map<string, FieldDependency> {
  const graph = new Map<string, FieldDependency>();

  // Initialize all fields
  rules.forEach((rule) => {
    rule.actions.forEach((action) => {
      if (!graph.has(action.field)) {
        graph.set(action.field, {
          field: action.field,
          dependsOn: [],
          rules: [],
        });
      }
    });

    rule.criteria.forEach((criterion) => {
      if (!graph.has(criterion.field)) {
        graph.set(criterion.field, {
          field: criterion.field,
          dependsOn: [],
          rules: [],
        });
      }
    });
  });

  // Build dependencies
  rules.forEach((rule) => {
    rule.actions.forEach((action) => {
      rule.criteria.forEach((criterion) => {
        const dependency = graph.get(action.field);
        if (dependency && !dependency.dependsOn.includes(criterion.field)) {
          dependency.dependsOn.push(criterion.field);
          dependency.rules.push(rule);
        }
      });
    });
  });

  return graph;
}

function sortStoriesByDependency(
  stories: FormStory[],
  fieldLabels: Record<string, string>,
  rules: KnackFormRule[]
): FormStory[] {
  const graph = buildDependencyGraph(rules);
  const labelToKey = Object.entries(fieldLabels).reduce((acc, [key, label]) => {
    acc[label] = key;
    return acc;
  }, {} as Record<string, string>);

  return stories.sort((a, b) => {
    const fieldA = a.title.replace("Field Dependencies for ", "");
    const fieldB = b.title.replace("Field Dependencies for ", "");
    const keyA = labelToKey[fieldA];
    const keyB = labelToKey[fieldB];

    if (!keyA || !keyB) return 0;

    const depthA = getFieldDepth(graph, keyA);
    const depthB = getFieldDepth(graph, keyB);

    return depthA - depthB;
  });
}

function getFieldDepth(
  graph: Map<string, FieldDependency>,
  field: string
): number {
  const dependency = graph.get(field);
  if (!dependency || dependency.dependsOn.length === 0) {
    return 0;
  }

  return (
    1 +
    Math.max(...dependency.dependsOn.map((dep) => getFieldDepth(graph, dep)))
  );
}

function getFormActionDescription(view: KnackFormView): string {
  if (!view.source) {
    return `[value]${view.action}[/value] a record`;
  }

  const parts = [
    `${view.action} a record in [value]${view.source.object}[/value]`,
  ];

  if (view.source.connection_key) {
    parts.push(`connected to [value]${view.source.connection_key}[/value]`);
  }

  if (view.source.relationship_type) {
    parts.push(`(${view.source.relationship_type} relationship)`);
  }

  if (view.source.authenticated_user) {
    parts.push("requiring authentication");
  }

  return parts.join(" ");
}

function generateAuthenticationStory(view: KnackFormView): FormStory | null {
  if (!view.source?.authenticated_user) {
    return null;
  }

  return {
    title: "Form Authentication",
    asA: "form user",
    iWant: "to submit the form with proper authentication",
    soThat: "my submission is properly associated with my account",
    acceptanceCriteria: [
      "### Given",
      "I am accessing the form",
      "",
      "### Scenario 1",
      "",
      "#### When",
      "- I am not logged in",
      "",
      "#### Then",
      "- I should be redirected to the login page",
      "- After logging in, I should be redirected back to the form",
      "",
      "### Scenario 2",
      "",
      "#### When",
      "- I am logged in",
      "",
      "#### Then",
      "- I should be able to view the form",
      "- My submission should be associated with my user account",
    ],
  };
}

function generateConnectionFieldStory(input: KnackFormInput): FormStory | null {
  if (input.type !== "connection" || !input.source) {
    return null;
  }

  const scenarios: string[] = ["### Given", "I am filling out the form", ""];

  if (input.source.type === "user" && input.source.connection_key) {
    scenarios.push(
      "### Scenario 1",
      "",
      "#### When",
      "- I am logged in as a user",
      "",
      "#### Then",
      "The following conditions should be met:",
      "",
      `- [ ] Options should be filtered to only show records where [field]${input.source.connection_key}[/field] matches my user ID`,
      "- [ ] Options should load dynamically",
      ""
    );
  } else {
    scenarios.push(
      "### Scenario 1",
      "",
      "#### When",
      "- The field loads",
      "",
      "#### Then",
      "The following conditions should be met:",
      "",
      "- [ ] Options should load dynamically"
    );

    if (input.source.type) {
      scenarios.push(
        `- [ ] Options should come from the [value]${input.source.type}[/value] connection`
      );
    }
  }

  if (input.source.filters?.length) {
    scenarios.push(
      "",
      "### Scenario 2",
      "",
      "#### When",
      "- Options are loading",
      "",
      "#### Then",
      "The following filters should be applied:",
      "",
      ...input.source.filters.map(
        (filter) =>
          `- [ ] [field]${filter.field}[/field] ${filter.operator} [value]${filter.value}[/value]`
      )
    );
  }

  return {
    title: `Connection Field: ${input.label}`,
    asA: "form user",
    iWant: "to select from valid connection options",
    soThat: "I can choose the correct related record",
    acceptanceCriteria: scenarios,
  };
}

export function generateFormStories(view: KnackFormView): FormStory[] {
  const fieldLabels = getFieldLabels(view);
  let stories: FormStory[] = [];

  stories.push({
    title: "Form Overview",
    asA: "form user",
    iWant: `to use the ${view.title} form`,
    soThat: "I can submit the required information",
    acceptanceCriteria: [
      "### Given",
      "",
      "- I am filling out the form",
      "",
      "### Then",
      "",
      "#### Form Settings",
      "",
      `- Form should ${getFormActionDescription(view)}`,
      `- Submit button should display [value]"${
        view.submit_button_text || "Submit"
      }"[/value]`,
      `- Form should contain [value]${countTotalFields(
        view
      )}[/value] total fields`,
      "",
      "#### Field Requirements",
      "",
      ...generateFieldGroupCriteria(view).map((criteria) =>
        criteria.startsWith("-") ? criteria : `- ${criteria}`
      ),
    ],
  });

  const authStory = generateAuthenticationStory(view);
  if (authStory) {
    stories.push(authStory);
  }

  view.groups.forEach((group) => {
    group.columns.forEach((column) => {
      column.inputs.forEach((input) => {
        const connectionStory = generateConnectionFieldStory(input);
        if (connectionStory) {
          stories.push(connectionStory);
        }
      });
    });
  });

  if (view.rules?.fields?.length) {
    const fieldStories = generateFieldRulesStories(
      view.rules.fields,
      fieldLabels
    );
    stories = stories.concat(
      sortStoriesByDependency(fieldStories, fieldLabels, view.rules.fields)
    );
  }

  if (view.rules?.submits?.length) {
    stories.push(...generateSubmitRulesStories(view.rules.submits));
  }

  if (view.rules?.records?.length) {
    stories.push(...generateRecordRulesStories(view.rules.records));
  }

  if (view.rules?.emails?.length) {
    stories.push(...generateEmailRulesStories(view.rules.emails));
  }

  return stories;
}

function countTotalFields(view: KnackFormView): number {
  return view.groups.reduce(
    (total, group) =>
      total +
      group.columns.reduce((colTotal, col) => colTotal + col.inputs.length, 0),
    0
  );
}

function generateFieldGroupCriteria(view: KnackFormView): string[] {
  const criteria: string[] = [];

  view.groups.forEach((group) => {
    group.columns.forEach((column) => {
      column.inputs.forEach((input) => {
        criteria.push(generateInputCriteria(input));
      });
    });
  });

  return criteria;
}

function generateInputCriteria(input: KnackFormInput): string {
  const parts: string[] = [];

  parts.push(`[field]${input.label}[/field] should be displayed`);

  if (input.format && "required" in input.format && input.format.required) {
    parts.push("marked as [value]required[/value]");
  }

  if (input.format && "validation" in input.format) {
    const validation = input.format.validation;
    if (validation.type !== "none") {
      parts.push(`with [value]${validation.type}[/value] validation`);
    }
    if (validation.regex) {
      parts.push("with [value]custom regex[/value] validation");
    }
  }

  if (input.instructions) {
    const cleanInstructions = input.instructions
      .replace(/<br\s*\/?>/g, " ")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (cleanInstructions) {
      parts.push(`with instructions: [value]"${cleanInstructions}"[/value]`);
    }
  }

  return parts.join(" and ");
}

function formatOperator(operator: string): string {
  const operatorMap: Record<string, string> = {
    is: "equals",
    "is not": "does not equal",
    "is blank": "is empty",
    "is not blank": "is not empty",
  };
  return operatorMap[operator] || operator;
}

function formatValue(value: string, operator: string): string {
  if (operator === "is blank" || operator === "is not blank") {
    return "";
  }
  return value || "(empty)";
}

function formatAction(action: string): string {
  const actionMap: Record<string, string> = {
    "hide-show": "be hidden",
    "show-hide": "be shown",
    show: "be shown",
    hide: "be hidden",
  };
  return actionMap[action] || action;
}

function generateFieldRulesStories(
  rules: KnackFormRule[],
  fieldLabels: Record<string, string>
): FormStory[] {
  const stories: FormStory[] = [];
  const sortedRules = [...rules].sort((a, b) => {
    const keyA = parseInt(a.key.split("_")[1]) || 0;
    const keyB = parseInt(b.key.split("_")[1]) || 0;
    return keyA - keyB;
  });

  const rulesByTriggerField = sortedRules.reduce((acc, rule) => {
    rule.criteria.forEach((criterion: KnackFormRuleCriteria) => {
      if (!acc[criterion.field]) {
        acc[criterion.field] = [];
      }
      if (!acc[criterion.field].find((r) => r.key === rule.key)) {
        acc[criterion.field].push(rule);
      }
    });
    return acc;
  }, {} as Record<string, KnackFormRule[]>);

  Object.entries(rulesByTriggerField).forEach(([field, fieldRules]) => {
    const sortedFieldRules = fieldRules.sort((a, b) => {
      const keyA = parseInt(a.key.split("_")[1]) || 0;
      const keyB = parseInt(b.key.split("_")[1]) || 0;
      return keyA - keyB;
    });

    const criteriaGroups = new Map<
      string,
      Array<{ label: string; action: string; ruleKey: string }>
    >();

    sortedFieldRules.forEach((rule: KnackFormRule) => {
      rule.criteria.forEach((criterion: KnackFormRuleCriteria) => {
        const key = `${criterion.operator}:${criterion.value}`;

        rule.actions.forEach((action: KnackFormRuleAction) => {
          const targetLabel = fieldLabels[action.field] || action.field;
          const actionText = formatAction(action.action);

          if (!criteriaGroups.has(key)) {
            criteriaGroups.set(key, []);
          }
          criteriaGroups.get(key)?.push({
            label: targetLabel,
            action: actionText,
            ruleKey: rule.key,
          });
        });
      });
    });

    const sourceLabel = fieldLabels[field] || field;
    const acceptanceCriteria: string[] = [
      "### Given",
      "I am filling out the form",
      "",
    ];

    const sortedGroups = Array.from(criteriaGroups.entries()).sort((a, b) => {
      const keyA = Math.min(
        ...a[1].map((item) => parseInt(item.ruleKey.split("_")[1]) || 0)
      );
      const keyB = Math.min(
        ...b[1].map((item) => parseInt(item.ruleKey.split("_")[1]) || 0)
      );
      return keyA - keyB;
    });

    sortedGroups.forEach(([key, affectedFields], index) => {
      const [operator, value] = key.split(":");
      const formattedOperator = formatOperator(operator);
      const formattedValue = formatValue(value, operator);

      const lines = [
        `### Scenario ${index + 1}`,
        "",
        "#### When",
        `I ${
          formattedOperator === "is empty" ? "leave" : "set"
        } [field]${sourceLabel}[/field] ${
          formattedOperator === "is empty"
            ? "empty"
            : `to [value]${formattedValue || "(empty)"}[/value]`
        }`,
        "",
        "#### Then",
        "The following fields should be affected:",
        "",
        ...affectedFields
          .sort((a, b) => {
            const keyA = parseInt(a.ruleKey.split("_")[1]) || 0;
            const keyB = parseInt(b.ruleKey.split("_")[1]) || 0;
            return keyA - keyB;
          })
          .map(
            ({ label, action }) =>
              `- [ ] [field]${label}[/field] should ${action}`
          ),
        "",
      ];

      acceptanceCriteria.push(lines.join("\n"));
    });

    stories.push({
      title: `Field Dependencies for ${sourceLabel}`,
      asA: "form user",
      iWant: "to see fields update based on my input",
      soThat: "I can provide the correct information",
      acceptanceCriteria,
    });
  });

  return stories.sort((a, b) => {
    const getFirstRuleKey = (story: FormStory) => {
      const match = story.acceptanceCriteria.join("\n").match(/rule_(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };
    return getFirstRuleKey(a) - getFirstRuleKey(b);
  });
}

function generateSubmitRulesStories(rules: KnackFormSubmitRule[]): FormStory[] {
  const acceptanceCriteria = [
    "### Given",
    "I submit the form",
    "",
    "### Then",
    "The following should occur:",
    "",
  ];

  rules.forEach((rule, index) => {
    if (rule.message) {
      const cleanMessage = rule.message
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();
      acceptanceCriteria.push(
        `- [ ] Display message: [value]"${cleanMessage}"[/value]`
      );
    }

    if (rule.reload_auto) {
      acceptanceCriteria.push("- [ ] Page should automatically reload");
    }

    if (rule.reload_show) {
      acceptanceCriteria.push("- [ ] Show reload option to user");
    }

    if (index < rules.length - 1) {
      acceptanceCriteria.push("");
    }
  });

  return [
    {
      title: "Form Submission Behavior",
      asA: "form user",
      iWant: "to submit the form and see appropriate feedback",
      soThat: "I know my submission was successful",
      acceptanceCriteria,
    },
  ];
}

function generateRecordRulesStories(rules: KnackFormRecordRule[]): FormStory[] {
  return [
    {
      title: "Record Management",
      asA: "system",
      iWant: "to process form submissions correctly",
      soThat: "data is properly stored and linked",
      acceptanceCriteria: rules.map((rule) => {
        const parts = [];
        parts.push(`Create/update record in "${rule.connection}"`);
        parts.push(`with ${rule.values.length} field mapping(s)`);
        if (rule.criteria?.length) {
          const conditions = rule.criteria
            .map((c: KnackFormRuleCriteria) => {
              const formattedOperator = formatOperator(c.operator);
              const formattedValue = formatValue(c.value, c.operator);
              return formattedValue
                ? `"${c.field}" ${formattedOperator} "${formattedValue}"`
                : `"${c.field}" ${formattedOperator}`;
            })
            .join(" AND ");
          parts.push(`when ${conditions}`);
        }
        return parts.join(" ");
      }),
    },
  ];
}

function generateEmailRulesStories(rules: KnackFormEmailRule[]): FormStory[] {
  return [
    {
      title: "Email Notifications",
      asA: "system",
      iWant: "to send appropriate notifications",
      soThat: "relevant parties are informed of form submissions",
      acceptanceCriteria: rules.map(
        (rule) =>
          `Send email from "${rule.email.from_name}" <${rule.email.from_email}> ` +
          `to ${rule.email.recipients.length} recipient(s) ` +
          `with subject "${rule.email.subject}"`
      ),
    },
  ];
}
