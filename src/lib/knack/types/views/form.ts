import { KnackField } from "../field";
import { ViewRule } from "../../rule";
import {
  FORM_VIEW,
  KnackViewBase,
  KnackViewSource,
  KnackRecordRule,
} from "../view";

export interface KnackFormView extends KnackViewBase {
  type: FORM_VIEW;
  action: "create" | "update";
  submit_button_text: string;
  source?: KnackViewSource;
  groups: ViewGroup[];
  rules?: FormRules;
}

export interface FormInput {
  id: string;
  instructions?: string;
  label: string;
  type: KnackField["type"];
  field?: { key: string };
  format?: unknown;
}

interface ViewColumn {
  inputs: FormInput[];
}

interface ViewGroup {
  columns: ViewColumn[];
}

type FormDisplayRule = ViewRule;
type FormSubmitRule = ViewRule;
type FormRecordRule = KnackRecordRule;
type FormEmailRule = ViewRule;

interface FormRules {
  fields: FormDisplayRule[];
  submits?: FormSubmitRule[];
  records: FormRecordRule[];
  emails: FormEmailRule[];
}
