import React, { useCallback } from "react";
import type { JsonTreeViewerProps, JSONValue } from "./types";
import { useJsonTree } from "./use-json-tree";
import { JsonTreeErrorBoundary } from "./error-boundary";
import { Header } from "./header";
import { SearchBar } from "./search";
import { TreeNode } from "./tree-node";
import { Footer } from "./footer";
import { createStyles } from "./utils";
import { Card, CardContent } from "@/components/ui/card";

export const JsonTreeViewer: React.FC<JsonTreeViewerProps> = ({
  title,
  data,
  className = "",
  maxDepth = 50,
  maxItems = 100,
  theme = "light",
  onNodeExpand,
  onValueCopy,
  defaultExpanded = ["root"],
  searchable = true,
  copyable = true,
  expandable = true,
}) => {
  const {
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
  } = useJsonTree({
    data,
    maxDepth,
    maxItems,
    defaultExpanded,
    onNodeExpand,
    onValueCopy,
  });

  const styles = createStyles(theme);

  const handleToggleExpanded = useCallback(
    (path: string) => {
      const wasExpanded = expandedPaths.has(path);
      toggleExpanded(path);
      onNodeExpand?.(path, !wasExpanded);
    },
    [toggleExpanded, onNodeExpand, expandedPaths]
  );

  const handleCopyValue = useCallback(
    async (value: JSONValue, path: string) => {
      await copyValue(value, path);
      onValueCopy?.(value, path);
    },
    [copyValue, onValueCopy]
  );

  return (
    <JsonTreeErrorBoundary theme={theme}>
      <Card className={`${styles.container} w-full ${className}`}>
        <Header
          title={title}
          onExpandAll={expandAll}
          onCollapseAll={collapseAll}
          theme={theme}
          expandable={expandable}
        />

        {searchable && (
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onClearSearch={clearSearch}
            theme={theme}
          />
        )}

        <CardContent className={styles.treeContent}>
          {processedData ? (
            <TreeNode
              value={processedData}
              keyName=""
              path="root"
              isLast={true}
              searchTerm={searchTerm}
              onToggleExpand={handleToggleExpanded}
              onCopyValue={handleCopyValue}
              isExpanded={expandedPaths.has("root")}
              isCopied={copiedPath === "root"}
              expandedPaths={expandedPaths}
              copiedPath={copiedPath}
              theme={theme}
              copyable={copyable}
              expandable={expandable}
            />
          ) : (
            <div className={styles.noData}>No data to display</div>
          )}
        </CardContent>

        <Footer searchTerm={searchTerm} theme={theme} />
      </Card>
    </JsonTreeErrorBoundary>
  );
};
