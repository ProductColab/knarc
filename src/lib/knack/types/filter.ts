import { KnackField } from "./field";

export interface KnackFilterRule {
  field: KnackField["key"];
  operator: KnackFilterOperator;
  value: string;
}

export type KnackFilterOperator =
  | "is"
  | "contains"
  | "is blank"
  | "is not blank";

export type KnackFilterMatch = "all" | "any";

export interface KnackFilterGroup {
  match: KnackFilterMatch;
  rules: KnackFilterRule[];
}
