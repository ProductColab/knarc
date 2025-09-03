import { KnackField } from "./types/field";
import { KnackFilterOperator } from "./types/filter";

export interface RuleValue {
  type: string; // e.g., "value"
  field: string;
  value: unknown;
  connection_field?: string | null;
}

export interface RuleCriterion {
  field: string;
  value: unknown;
  operator: string;
  value_type?: string;
  value_field?: string;
}

export interface ViewRule {
  field: KnackField["key"];
  operator: KnackFilterOperator;
  value: string | { [key: string]: unknown };
}
