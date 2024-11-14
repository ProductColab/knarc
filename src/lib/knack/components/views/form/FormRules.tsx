import { useMemo } from "react";
import type { KnackFormRule } from "../../../types/form";
import { RulesSequence } from "./RulesSequence";
import { RulesTable } from "./RulesTable";

interface FormRulesProps {
  rules: KnackFormRule[];
  inputs: Array<{
    id: string;
    label: string;
    // ... other input properties
  }>;
  view?: "table" | "sequence";
}

export function FormRules({
  rules,
  inputs,
  view = "sequence",
}: FormRulesProps) {
  // Create a mapping of field IDs to their labels
  const fieldLabels = useMemo(() => {
    return inputs.reduce((acc, input) => {
      acc[input.id] = input.label;
      return acc;
    }, {} as Record<string, string>);
  }, [inputs]);

  console.log("Field Labels in FormRules:", fieldLabels);
  console.log("Rules in FormRules:", rules);
  console.log("Inputs in FormRules:", inputs);

  if (view === "table") {
    return <RulesTable rules={rules} fieldLabels={fieldLabels} />;
  }

  return <RulesSequence rules={rules} fieldLabels={fieldLabels} />;
}
