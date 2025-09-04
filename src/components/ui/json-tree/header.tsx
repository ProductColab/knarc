import React from "react";
import { FileText } from "lucide-react";
import type { HeaderProps } from "./types";
import { createStyles, getThemeColors } from "./utils";

export const Header: React.FC<HeaderProps> = ({
  title,
  onExpandAll,
  onCollapseAll,
  theme,
  expandable = true,
}) => {
  const styles = createStyles(theme);
  const colors = getThemeColors(theme);

  return (
    <div className={styles.header}>
      <div className="flex items-center space-x-2">
        <FileText className={`w-5 h-5 ${colors.icon}`} />
        {title ? <h3 className={styles.headerTitle}>{title}</h3> : null}
      </div>
      {expandable && (
        <div className="flex items-center space-x-2">
          <button
            onClick={onExpandAll}
            className={colors.button}
            type="button"
            aria-label="Expand all nodes"
          >
            Expand All
          </button>
          <button
            onClick={onCollapseAll}
            className={colors.button}
            type="button"
            aria-label="Collapse all nodes"
          >
            Collapse All
          </button>
        </div>
      )}
    </div>
  );
};
