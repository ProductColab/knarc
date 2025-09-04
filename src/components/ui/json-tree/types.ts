export type SpecialValue =
  | { __circular: true; __reference: string; __message: string }
  | {
      __truncated: true;
      __reason: string;
      __depth?: number;
      __originalLength?: number;
      __showing?: number;
      __message: string;
    }
  | { __error: true; __message: string }
  | { __parseError: true; __message: string; __originalData: string };

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONObject
  | JSONArray
  | SpecialValue;

export interface JSONObject {
  [key: string]: JSONValue;
}

export type JSONArray = Array<JSONValue>;

export type ValueType =
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "object"
  | "array"
  | "circular"
  | "truncated"
  | "error"
  | "parseError";

export type Theme = "light" | "dark";

export interface JsonTreeViewerProps {
  title?: string;
  data: unknown;
  className?: string;
  maxDepth?: number;
  maxItems?: number;
  theme?: Theme;
  onNodeExpand?: (path: string, isExpanded: boolean) => void;
  onValueCopy?: (value: JSONValue, path: string) => void;
  defaultExpanded?: string[];
  searchable?: boolean;
  copyable?: boolean;
  expandable?: boolean;
}

export interface TreeNodeProps {
  value: JSONValue;
  keyName: string;
  path: string;
  level?: number;
  isLast?: boolean;
  searchTerm?: string;
  onToggleExpand: (path: string) => void;
  onCopyValue: (value: JSONValue, path: string) => void;
  isExpanded: boolean;
  isCopied: boolean;
  expandedPaths: Set<string>;
  copiedPath: string;
  theme: Theme;
  copyable?: boolean;
  expandable?: boolean;
}

export interface HeaderProps {
  title?: string;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  theme: Theme;
  expandable?: boolean;
}

export interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onClearSearch: () => void;
  theme: Theme;
}

export interface FooterProps {
  searchTerm: string;
  theme: Theme;
}

export interface UseJsonTreeOptions {
  data: unknown;
  maxDepth?: number;
  maxItems?: number;
  defaultExpanded?: string[];
  onNodeExpand?: (path: string, isExpanded: boolean) => void;
  onValueCopy?: (value: JSONValue, path: string) => void;
}

export interface UseJsonTreeReturn {
  processedData: JSONValue;
  expandedPaths: Set<string>;
  searchTerm: string;
  copiedPath: string;
  setSearchTerm: (term: string) => void;
  toggleExpanded: (path: string) => void;
  copyValue: (value: JSONValue, path: string) => Promise<void>;
  expandAll: () => void;
  collapseAll: () => void;
  clearSearch: () => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
