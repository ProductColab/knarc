import {
  KnackViewBase,
  KnackViewColumn,
  KnackViewGroup,
  KnackViewSource,
  TABLE_VIEW,
} from "../view";

export interface KnackTableView extends KnackViewBase {
  type: TABLE_VIEW;
  columns: KnackViewColumn[];
  groups: KnackViewGroup[];
  source: KnackViewSource;
}
