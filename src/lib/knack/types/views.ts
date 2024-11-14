/**
 * View types and related interfaces
 */

import type { KnackFieldFormat, KnackFieldType } from "./fields";
import type { KnackFilter } from "./filters";
import type { KnackFormRules } from "./form";

// Column-related types
interface KnackColumnWidth {
  type: "default" | "custom";
  units: "px" | "%";
  amount: string;
}

interface KnackColumnIcon {
  icon: string;
  align: "left" | "right" | "center";
}

interface KnackColumnLinkDesign {
  size: "s" | "m" | "l";
  format: "outline" | "solid";
  uppercase: boolean;
  rounded: boolean;
  raised: boolean;
  borderThickness: "thin" | "medium" | "thick";
  colors?: {
    button?: {
      custom: boolean;
      color: string;
    };
    text?: {
      custom: boolean;
      color: string;
    };
  };
  icon?: KnackColumnIcon;
  styles?: string[];
}

interface KnackColumnBase {
  grouping?: boolean;
  group_sort?: "asc" | "desc";
  ignore_edit: boolean;
  ignore_summary: boolean;
  conn_separator: string;
  conn_link: string;
  icon: KnackColumnIcon;
  img_gallery: string;
  width?: KnackColumnWidth;
  align: "left" | "center" | "right";
  rules: Array<Record<string, unknown>>;
  header: string;
  connection?: {
    key: string;
  };
}

interface KnackFieldColumn extends KnackColumnBase {
  type: "field";
  field: {
    key: string;
  };
  id: string;
}

interface KnackLinkColumn extends KnackColumnBase {
  type: "link";
  link_type: "text" | "field";
  link_text: string;
  link_field: string;
  link_design_active: boolean;
  link_design?: KnackColumnLinkDesign;
  remote?: boolean;
  scene?: string;
}

type KnackTableColumn = KnackFieldColumn | KnackLinkColumn;

// Source types
interface KnackViewSourceBase {
  object: string;
  criteria?: {
    match: "all" | "any";
    rules: unknown[];
    groups: unknown[];
  };
  sort?: Array<{
    field: string;
    order: "asc" | "desc";
  }>;
  authenticated_user?: boolean;
  connection_key?: string;
  relationship_type?: "foreign" | "one_to_many" | "many_to_one";
}

export interface KnackTableViewSource extends KnackViewSourceBase {
  limit: string;
  parent_source?: {
    connection: string;
    object: string;
  };
}

export interface KnackFormViewSource extends KnackViewSourceBase {
  parent_source?: {
    connection: string;
    object: string;
  };
}

export type KnackViewSource = KnackTableViewSource | KnackFormViewSource;

// View types
export interface KnackViewBase {
  _id: string;
  key: string;
  name: string;
  title: string;
  type: "table" | "form" | "rich_text";
  description?: string;
}

export interface KnackTableView extends KnackViewBase {
  type: "table";
  columns: KnackTableColumn[];
  rows_per_page: string;
  keyword_search: boolean;
  allow_exporting: boolean;
  allow_preset_filters: boolean;
  filter_type: string;
  menu_filters: Array<Record<string, unknown>>;
  filter_fields: string;
  allow_limit: boolean;
  source: KnackTableViewSource;
}

export interface KnackFormView extends KnackViewBase {
  type: "form";
  action: "create" | "update";
  submit_button_text: string;
  source?: KnackFormViewSource;
  groups: Array<{
    columns: Array<{
      inputs: KnackFormInput[];
    }>;
  }>;
  rules?: KnackFormRules;
}

export interface KnackRichTextView extends KnackViewBase {
  type: "rich_text";
  content: string;
}

export type KnackView = KnackTableView | KnackFormView | KnackRichTextView;

export interface KnackFormInput {
  instructions?: string;
  source?: {
    filters: KnackFilter[];
    connections?: Array<{
      field: { key: string };
      source: {
        type: "input";
        field: { key: string };
      };
    }>;
    type?: "user";
    connection_key?: string;
    remote_key?: string;
  };
  field: {
    key: string;
  };
  id?: string;
  label: string;
  type: KnackFieldType;
  format?: KnackFieldFormat;
  allow_option_inserts?: boolean;
  view?: string;
}
