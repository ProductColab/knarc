// useJsonTree.ts
import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { JSONValue, JSONObject, UseJsonTreeOptions } from "./types";
import { getChildEntries } from "./utils";

export function useJsonTree({
  data,
  maxDepth = 50,
  maxItems = 100,
  defaultExpanded = ["root"],
  onNodeExpand,
  onValueCopy,
}: UseJsonTreeOptions) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set(defaultExpanded)
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [copiedPath, setCopiedPath] = useState<string>("");

  // Process and sanitize the input data
  const processedData: JSONValue = useMemo(() => {
    const circularRefs = new WeakSet<object>();
    const pathTracker = new Map<object, string>();

    function processValue(
      value: unknown,
      currentPath: string = "root",
      depth: number = 0
    ): JSONValue {
      // Handle max depth
      if (depth >= maxDepth) {
        return {
          __truncated: true,
          __reason: "max_depth",
          __depth: depth,
          __message: `Truncated at depth ${maxDepth}`,
        };
      }

      // Handle primitives and null
      if (value === null || typeof value !== "object") {
        return value as JSONValue;
      }

      // Handle circular references
      if (circularRefs.has(value)) {
        const originalPath = pathTracker.get(value) || "unknown";
        return {
          __circular: true,
          __reference: originalPath,
          __message: `Circular reference to ${originalPath}`,
        };
      }

      circularRefs.add(value);
      pathTracker.set(value, currentPath);

      try {
        if (Array.isArray(value)) {
          if (value.length > maxItems) {
            const truncatedArray: JSONValue[] = value
              .slice(0, maxItems)
              .map((item, i) =>
                processValue(item, `${currentPath}[${i}]`, depth + 1)
              );
            truncatedArray.push({
              __truncated: true,
              __reason: "max_items",
              __originalLength: value.length,
              __showing: maxItems,
              __message: `Showing ${maxItems} of ${value.length} items`,
            });
            return truncatedArray;
          }
          return value.map((item, i) =>
            processValue(item, `${currentPath}[${i}]`, depth + 1)
          );
        }

        // Handle objects
        const keys = Object.keys(value);
        if (keys.length > maxItems) {
          const result: JSONObject = {};
          const limitedKeys = keys.slice(0, maxItems);

          for (const key of limitedKeys) {
            try {
              result[key] = processValue(
                value[key as keyof typeof value],
                `${currentPath}.${key}`,
                depth + 1
              );
            } catch (err) {
              const message =
                err instanceof Error ? err.message : "Unknown error";
              result[key] = {
                __error: true,
                __message: `Error processing key "${key}": ${message}`,
              };
            }
          }

          result.__truncated = {
            __truncated: true,
            __reason: "max_items",
            __originalLength: keys.length,
            __showing: maxItems,
            __message: `Showing ${maxItems} of ${keys.length} properties`,
          };
          return result;
        }

        const result: JSONObject = {};
        for (const key of keys) {
          try {
            result[key] = processValue(
              value[key as keyof typeof value],
              `${currentPath}.${key}`,
              depth + 1
            );
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Unknown error";
            result[key] = {
              __error: true,
              __message: `Error processing key "${key}": ${message}`,
            };
          }
        }
        return result;
      } finally {
        circularRefs.delete(value);
      }
    }

    // Handle string input (parse JSON)
    let parsedData: unknown;
    if (typeof data === "string") {
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return {
          __parseError: true,
          __message: `JSON Parse Error: ${message}`,
          __originalData:
            data.length > 200 ? data.substring(0, 200) + "..." : data,
        };
      }
    } else {
      parsedData = data;
    }

    return processValue(parsedData);
  }, [data, maxDepth, maxItems]);

  const toggleExpanded = useCallback(
    (path: string) => {
      setExpandedPaths((prev) => {
        const newSet = new Set(prev);
        const wasExpanded = newSet.has(path);

        if (wasExpanded) {
          newSet.delete(path);
        } else {
          newSet.add(path);
        }

        onNodeExpand?.(path, !wasExpanded);
        return newSet;
      });
    },
    [onNodeExpand]
  );

  const copyValue = useCallback(
    async (value: JSONValue, path: string) => {
      try {
        let copyText: string;

        if (
          value &&
          typeof value === "object" &&
          ("__circular" in value ||
            "__truncated" in value ||
            "__error" in value)
        ) {
          copyText =
            typeof value === "object" && value && "__message" in value
              ? (value.__message as string)
              : "Special value";
        } else {
          copyText = JSON.stringify(value, null, 2);
        }

        await navigator.clipboard.writeText(copyText);
        setCopiedPath(path);
        setTimeout(() => setCopiedPath(""), 2000);

        toast.success("Copied to clipboard");
        onValueCopy?.(value, path);
      } catch (err) {
        console.error("Failed to copy:", err);
        toast.error("Failed to copy to clipboard");
      }
    },
    [onValueCopy]
  );

  const expandAll = useCallback(() => {
    function getAllPaths(
      obj: JSONValue,
      currentPath: string = "root",
      depth = 0
    ): string[] {
      if (depth >= maxDepth) return [currentPath];
      const paths = [currentPath];

      if (
        obj &&
        typeof obj === "object" &&
        !("__circular" in obj) &&
        !("__truncated" in obj) &&
        !("__error" in obj)
      ) {
        for (const [key, child] of getChildEntries(obj)) {
          paths.push(...getAllPaths(child, `${currentPath}.${key}`, depth + 1));
        }
      }
      return paths;
    }

    setExpandedPaths(new Set(getAllPaths(processedData)));
  }, [processedData, maxDepth]);

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set(["root"]));
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  return {
    processedData,
    expandedPaths,
    searchTerm,
    copiedPath,
    setSearchTerm,
    toggleExpanded,
    copyValue,
    expandAll,
    collapseAll,
    clearSearch,
  };
}
