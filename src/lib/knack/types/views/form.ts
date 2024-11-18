import { KnackField } from "../field";
import { KnackFilterOperator } from "../filter";
import { FORM_VIEW, KnackViewBase, KnackViewSource } from "../view";

export interface KnackFormView extends KnackViewBase {
  type: FORM_VIEW;
  action: "create" | "update";
  submit_button_text: string;
  source?: KnackViewSource;
  groups: ViewGroup[];
  rules?: FormRules;
}

export interface FormInput {
  instructions?: string;
  label: string;
  type: KnackField["type"];
  format?: unknown;
}

interface ViewColumn {
  inputs: FormInput[];
}

interface ViewGroup {
  columns: ViewColumn[];
}

interface DisplayRule {
  field: KnackField["key"];
  operator: KnackFilterOperator;
  value: string;
}

interface SubmitRule {
  field: KnackField["key"];
  operator: KnackFilterOperator;
  value: string;
}

interface RecordRule {
  field: KnackField["key"];
  operator: KnackFilterOperator;
  value: string;
}

interface EmailRule {
  field: KnackField["key"];
  operator: KnackFilterOperator;
  value: string;
}

interface FormRules {
  field: DisplayRule[];
  submit: SubmitRule[];
  record: RecordRule[];
  email: EmailRule[];
}
