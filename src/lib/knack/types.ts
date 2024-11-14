import type {
  KnackFormViewSource,
  KnackTableViewSource,
  KnackView,
} from "./types/views";

export type {
  KnackView,
  KnackViewBase,
  KnackTableView,
  KnackFormView,
  KnackRichTextView,
  KnackTableViewSource,
  KnackFormViewSource,
} from "./types/views";

// Add any non-view related types here
export interface KnackScene {
  _id: string;
  key: string;
  name: string;
  slug: string;
  views?: KnackView[];
  authenticated: boolean;
  allowed_profiles?: string[];
}

export type KnackViewSource = KnackTableViewSource | KnackFormViewSource;
