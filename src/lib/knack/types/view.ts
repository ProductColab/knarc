import { ViewRule } from "../rule";
import { KnackFilterGroup, KnackFilterRule } from "./filter";
import { KnackObject } from "./object";
import { KnackSortRule } from "./sort";
import { KnackFormView } from "./views/form";
import { KnackTableView } from "./views/table";

export type FORM_VIEW = "form";
export type TABLE_VIEW = "table";
export type RICH_TEXT_VIEW = "rich_text";
export type KnackViewType = FORM_VIEW | TABLE_VIEW | RICH_TEXT_VIEW;

export interface KnackViewSource {
  object: KnackObject["key"];
  criteria?: KnackFilterGroup;
  sort?: KnackSortRule[];
  authenticated_user?: boolean;
  connection_key?: string;
  filters?: KnackFilterRule[];
  limit?: string | null;
  relationship_type?: "foreign" | "one_to_many" | "many_to_one";
}

export interface KnackColumnField {
  key?: string;
  name?: string;
}

export interface KnackViewInput {
  id?: string;
  key?: string;
  type?: string;
  field?: { key: string };
  label?: string;
}

export interface KnackViewField {
  name?: string;
  field?: string;
  key?: string;
  operator?: string;
  value?: unknown;
  multi_type?: string;
  multi_input?: string;
  multi_match?: string;
  ignore_operators?: boolean;
  operator_default?: string;
}

export interface KnackColumnWidth {
  type: "default" | "fixed" | "auto" | string;
  units: string; // e.g. "px", "%"
  amount: string; // stored as string in schema
}

export interface KnackColumnIcon {
  icon: string;
  align: "left" | "right" | "center" | string;
}

export interface KnackColumnBase {
  id?: string;
  type: string;
  align?: "left" | "right" | "center" | string;
  header?: string;
  icon?: KnackColumnIcon | string;
  width?: KnackColumnWidth | number;
  grouping?: boolean;
  group_sort?: "asc" | "desc" | string;
  conn_link?: string;
  link_text?: string;
  link_type?: string;
  link_field?: string;
  conn_separator?: string;
  ignore_edit?: boolean;
  ignore_summary?: boolean;
  link_design_active?: boolean;
  rules?: ViewRule[];
  sortable?: boolean;
  scene?: string;
  groups?: KnackColumnGroup[];
}

export interface KnackFieldColumn extends KnackColumnBase {
  type: "field";
  field: { key: string };
}

export interface KnackDeleteColumn extends KnackColumnBase {
  type: "delete";
}

export interface KnackActionRuleCriterion {
  field: string;
  value: unknown | unknown[];
  operator: string;
}

export interface KnackRecordRuleValue {
  type: string; // e.g. "record"
  field: string;
  input?: string;
  value: unknown | unknown[];
  action?: string;
  connection_field?: string | null;
}

export interface KnackRecordRule {
  key?: string;
  action: string; // e.g. "record"
  values?: KnackRecordRuleValue[];
  criteria?: KnackActionRuleCriterion[] | null;
}

export type KnackSubmitRule =
  | { action: "message"; message: string; reload_show?: boolean }
  | { action: string; [key: string]: unknown };

export interface KnackActionRule {
  key?: string;
  link_text?: string;
  criteria?: KnackActionRuleCriterion[];
  record_rules?: KnackRecordRule[];
  submit_rules?: KnackSubmitRule[];
}

export interface KnackActionLinkColumn extends KnackColumnBase {
  type: "action_link";
  action_rules?: KnackActionRule[];
}

export type KnackViewColumn =
  | KnackFieldColumn
  | KnackDeleteColumn
  | KnackActionLinkColumn
  | (KnackColumnBase & { type: string });

export interface KnackColumnGroup {
  columns?: Array<Array<KnackColumnField> | KnackColumnField>;
}

export interface KnackViewGroup {
  columns?: {
    inputs?: KnackViewInput[];
    fields?: KnackViewField[];
  }[];
}

export interface KnackViewResults {
  type?: string;
  columns?: KnackViewColumn[];
  source?: KnackViewSource;
}

export interface KnackViewBase {
  _id: string;
  key: string;
  name: string;
  type: string;
  title?: string;
  source?: KnackViewSource;
  results?: KnackViewResults;
  columns?: KnackViewColumn[];
  links?: unknown[];
  inputs?: KnackViewInput[];
  groups?: KnackViewGroup[];
  totals?: unknown[];
  description?: string;
  hide_empty?: boolean;
  hide_fields?: boolean;
  label_format?: string;
  results_type?: string;
  allow_exporting?: boolean;
  submit_button_text?: string;
  table_design_active?: boolean;
  keyword_search_fields?: string;
  allowed_profiles?: string[];
  limit_profile_access?: boolean;
}

export type KnackView = KnackFormView | KnackTableView;
