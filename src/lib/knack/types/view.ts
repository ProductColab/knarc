import { KnackFilterGroup } from "./filter";
import { KnackObject } from "./object";
import { KnackSortRule } from "./sort";

export type FORM_VIEW = "form";
export type TABLE_VIEW = "table";
export type RICH_TEXT_VIEW = "rich_text";
export type KnackViewType = FORM_VIEW | TABLE_VIEW | RICH_TEXT_VIEW;

export interface KnackView {
  _id: string;
  key: string;
  name: string;
  title: string;
  type: KnackViewType;
  description?: string;
}

export interface KnackViewSource {
  object: KnackObject["key"];
  criteria?: KnackFilterGroup;
  sort?: KnackSortRule[];
  authenticated_user?: boolean;
  connection_key?: string;
  relationship_type?: "foreign" | "one_to_many" | "many_to_one";
}
