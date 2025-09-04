import type { JSONValue, ValueType, Theme } from "./types";

export const VALUE_COLORS = {
  light: {
    string: "text-green-600",
    number: "text-blue-600",
    boolean: "text-purple-600",
    null: "text-gray-400",
    object: "text-gray-700",
    array: "text-gray-700",
    circular: "text-orange-600",
    truncated: "text-yellow-600",
    error: "text-red-600",
    parseError: "text-red-600",
  },
  dark: {
    string: "text-green-400",
    number: "text-blue-400",
    boolean: "text-purple-400",
    null: "text-gray-500",
    object: "text-gray-300",
    array: "text-gray-300",
    circular: "text-orange-400",
    truncated: "text-yellow-400",
    error: "text-red-400",
    parseError: "text-red-400",
  },
} as const;

export function getValueType(value: JSONValue): ValueType {
  if (value === null) return "null";
  if (value && typeof value === "object") {
    if ("__circular" in value) return "circular";
    if ("__truncated" in value) return "truncated";
    if ("__error" in value) return "error";
    if ("__parseError" in value) return "parseError";
    if (Array.isArray(value)) return "array";
    return "object";
  }
  return typeof value as ValueType;
}

export function getChildEntries(value: JSONValue): Array<[string, JSONValue]> {
  if (!value || typeof value !== "object") return [];
  if (
    "__circular" in value ||
    "__truncated" in value ||
    "__error" in value ||
    "__parseError" in value
  ) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => [index.toString(), item]);
  }
  return Object.entries(value);
}

export function getItemCount(value: JSONValue, type: ValueType): string {
  if (type === "array" && Array.isArray(value)) {
    return `${value.length} items`;
  }
  if (
    type === "object" &&
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return `${Object.keys(value).length} keys`;
  }
  return "";
}

export function formatValue(value: JSONValue, type: ValueType): string {
  switch (type) {
    case "string":
      return `"${value}"`;
    case "number":
    case "boolean":
      return String(value);
    case "null":
      return "null";
    case "circular":
      return value && typeof value === "object" && "__message" in value
        ? (value.__message as string)
        : "Circular reference";
    case "truncated":
      return value && typeof value === "object" && "__message" in value
        ? (value.__message as string)
        : "Truncated";
    case "error":
    case "parseError":
      return value && typeof value === "object" && "__message" in value
        ? (value.__message as string)
        : "Error";
    default:
      return String(value);
  }
}

export function matchesSearch(
  key: string,
  value: JSONValue,
  searchTerm: string
): boolean {
  const term = searchTerm.toLowerCase();

  // Search in key
  if (key.toLowerCase().includes(term)) return true;

  // Search in value
  const formattedValue = formatValue(value, getValueType(value)).toLowerCase();
  if (formattedValue.includes(term)) return true;

  return false;
}

export function createStyles(theme: Theme) {
  return {
    container:
      theme === "light"
        ? "bg-white border border-gray-200 rounded-lg shadow-sm"
        : "bg-gray-800 border border-gray-600 rounded-lg shadow-sm",
    header:
      theme === "light"
        ? "flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg"
        : "flex items-center justify-between p-4 border-b border-gray-600 bg-gray-700 rounded-t-lg",
    headerTitle:
      theme === "light"
        ? "font-semibold text-gray-800"
        : "font-semibold text-gray-200",
    searchBar:
      theme === "light"
        ? "p-4 border-b border-gray-100"
        : "p-4 border-b border-gray-600",
    searchInput:
      theme === "light"
        ? "w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150"
        : "w-full pl-10 pr-10 py-2 border border-gray-600 bg-gray-700 text-gray-200 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-150",
    treeContent:
      theme === "light"
        ? "h-96 overflow-auto p-2"
        : "h-96 overflow-auto p-2 bg-gray-800",
    treeNodeRow:
      theme === "light"
        ? "flex items-center hover:bg-gray-50 rounded px-2 py-1 group transition-colors duration-150"
        : "flex items-center hover:bg-gray-700 rounded px-2 py-1 group transition-colors duration-150",
    footer:
      theme === "light"
        ? "px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-600 rounded-b-lg"
        : "px-4 py-2 bg-gray-700 border-t border-gray-600 text-xs text-gray-400 rounded-b-lg",
    noData:
      theme === "light"
        ? "p-4 text-gray-500 text-center"
        : "p-4 text-gray-400 text-center",
    errorBoundary:
      theme === "light"
        ? "p-4 bg-red-50 border border-red-200 rounded-lg"
        : "p-4 bg-red-900 border border-red-600 rounded-lg",
    errorText: theme === "light" ? "text-red-800" : "text-red-200",
    errorButton:
      theme === "light"
        ? "px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm transition-colors"
        : "px-3 py-1 bg-red-800 hover:bg-red-700 text-red-200 rounded text-sm transition-colors",
  };
}

export function getThemeColors(theme: Theme) {
  return {
    icon: theme === "light" ? "text-gray-600" : "text-gray-400",
    meta:
      theme === "light"
        ? "text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded"
        : "text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded",
    button:
      theme === "light"
        ? "px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded transition-colors duration-150"
        : "px-3 py-1 text-xs font-medium text-gray-300 hover:bg-gray-600 rounded transition-colors duration-150",
    key:
      theme === "light"
        ? "text-gray-800 font-medium"
        : "text-gray-200 font-medium",
    colon: theme === "light" ? "text-gray-500 mx-2" : "text-gray-400 mx-2",
    count:
      theme === "light"
        ? "text-gray-400 text-xs ml-2"
        : "text-gray-500 text-xs ml-2",
    closingBracket:
      theme === "light"
        ? "text-gray-500 font-semibold"
        : "text-gray-400 font-semibold",
    expandButton:
      theme === "light"
        ? "flex items-center justify-center w-4 h-4 mr-2 hover:bg-gray-200 rounded transition-colors duration-150"
        : "flex items-center justify-center w-4 h-4 mr-2 hover:bg-gray-600 rounded transition-colors duration-150",
    expandIcon:
      theme === "light" ? "w-3 h-3 text-gray-600" : "w-3 h-3 text-gray-400",
    copyButton:
      theme === "light"
        ? "ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all duration-150"
        : "ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 rounded transition-all duration-150",
    copyIcon: (isCopied: boolean) =>
      isCopied
        ? "text-green-600 w-3 h-3"
        : theme === "light"
        ? "text-gray-500 w-3 h-3"
        : "text-gray-400 w-3 h-3",
    searchClearButton:
      theme === "light"
        ? "absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded transition-colors duration-150"
        : "absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-600 rounded transition-colors duration-150",
    valueError:
      theme === "light" ? "bg-red-50 px-1 rounded" : "bg-red-900 px-1 rounded",
  };
}
