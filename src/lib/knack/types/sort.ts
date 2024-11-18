import { KnackField } from "./field";

export interface KnackSortRule {
  field: KnackField["key"];
  order: "asc" | "desc";
}
