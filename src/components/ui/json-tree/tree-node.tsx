import React, { useMemo } from "react";
import { ChevronRight, ChevronDown, Copy } from "lucide-react";
import type { TreeNodeProps } from "./types";
import {
  getValueType,
  getChildEntries,
  getItemCount,
  formatValue,
  matchesSearch,
  VALUE_COLORS,
  getThemeColors,
} from "./utils";

export const TreeNode: React.FC<TreeNodeProps> = ({
  value,
  keyName,
  path,
  level = 0,
  isLast = true,
  searchTerm = "",
  onToggleExpand,
  onCopyValue,
  isExpanded,
  isCopied,
  expandedPaths,
  copiedPath,
  theme,
  copyable = true,
  expandable = true,
}) => {
  const type = getValueType(value);
  const colors = getThemeColors(theme);

  const isExpandableNode =
    expandable &&
    (type === "object" || type === "array") &&
    !(
      value &&
      typeof value === "object" &&
      ("__circular" in value ||
        "__truncated" in value ||
        "__error" in value ||
        "__parseError" in value)
    );

  const filteredEntries = useMemo(() => {
    if (!isExpandableNode) return [];
    const entries = getChildEntries(value);
    if (!searchTerm) return entries;
    return entries.filter(([key, val]) => matchesSearch(key, val, searchTerm));
  }, [value, searchTerm, isExpandableNode]);

  const hasChildren = useMemo(() => {
    if (!isExpandableNode) return false;
    const entries = getChildEntries(value);
    if (!searchTerm) return entries.length > 0;
    return (
      entries.filter(([key, val]) => matchesSearch(key, val, searchTerm))
        .length > 0
    );
  }, [isExpandableNode, value, searchTerm]);

  const shouldShow =
    !searchTerm ||
    matchesSearch(keyName, value, searchTerm) ||
    (isExpandableNode && filteredEntries.length > 0);

  if (!shouldShow) return null;

  const indent = level * 20;
  const bracketColor = `${VALUE_COLORS[theme][type]} font-semibold`;

  // Add comma if not last
  const renderComma = !isLast;

  return (
    <div className="font-mono text-sm">
      <div
        className="flex items-center hover:bg-gray-50 rounded px-2 py-1 group transition-colors duration-150 select-none cursor-default"
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={() => hasChildren && onToggleExpand(path)}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(path);
            }}
            className={colors.expandButton}
            type="button"
            aria-label={isExpanded ? "Collapse node" : "Expand node"}
          >
            {isExpanded ? (
              <ChevronDown className={colors.expandIcon} />
            ) : (
              <ChevronRight className={colors.expandIcon} />
            )}
          </button>
        ) : (
          <div className="w-4 h-4 mr-2" />
        )}

        {/* Key */}
        {keyName && (
          <>
            <span className={colors.key}>{keyName}</span>
            <span className={colors.colon}>:</span>
          </>
        )}

        {/* Value */}
        {isExpandableNode ? (
          <div className="flex items-center">
            <span className={bracketColor}>{type === "array" ? "[" : "{"}</span>
            {!isExpanded && (
              <span className={colors.count}>{getItemCount(value, type)}</span>
            )}
            {!isExpanded && (
              <span className={`${bracketColor} ml-1`}>
                {type === "array" ? "]" : "}"}
              </span>
            )}
            {!isExpanded && renderComma && (
              <span className="text-gray-400 ml-1">,</span>
            )}
          </div>
        ) : (
          <>
            <span
              className={`${VALUE_COLORS[theme][type]} ${
                type === "error" || type === "parseError"
                  ? colors.valueError
                  : ""
              }`}
            >
              {formatValue(value, type)}
            </span>
            {renderComma && <span className="text-gray-400 ml-1">,</span>}
          </>
        )}

        {/* Copy Button */}
        {copyable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopyValue(value, path);
            }}
            className={colors.copyButton}
            title="Copy value"
            type="button"
            aria-label="Copy value to clipboard"
          >
            <Copy className={colors.copyIcon(isCopied)} />
          </button>
        )}
      </div>

      {/* Children */}
      {isExpandableNode && isExpanded && filteredEntries.length > 0 && (
        <div>
          {filteredEntries.map(([key, childValue], index) => {
            const childPath = `${path}.${key}`;
            const childExpanded = expandedPaths.has(childPath);
            const childCopied = copiedPath === childPath;
            return (
              <TreeNode
                key={key}
                value={childValue}
                keyName={key}
                path={childPath}
                level={level + 1}
                isLast={index === filteredEntries.length - 1}
                searchTerm={searchTerm}
                onToggleExpand={onToggleExpand}
                onCopyValue={onCopyValue}
                isExpanded={childExpanded}
                isCopied={childCopied}
                expandedPaths={expandedPaths}
                copiedPath={copiedPath}
                theme={theme}
                copyable={copyable}
                expandable={expandable}
              />
            );
          })}
        </div>
      )}

      {/* Closing bracket */}
      {isExpandableNode && isExpanded && (
        <div
          className={colors.closingBracket}
          style={{ paddingLeft: `${indent + 24}px` }}
        >
          {type === "array" ? "]" : "}"}
          {renderComma && <span className="text-gray-400 ml-1">,</span>}
        </div>
      )}
    </div>
  );
};
