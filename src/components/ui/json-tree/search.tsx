import React from "react";
import { Search, X } from "lucide-react";
import type { SearchBarProps } from "./types";
import { createStyles, getThemeColors } from "./utils";

export const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  onClearSearch,
  theme,
}) => {
  const styles = createStyles(theme);
  const colors = getThemeColors(theme);

  return (
    <div className={styles.searchBar}>
      <div className="relative">
        <Search
          className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${colors.icon}`}
        />
        <input
          type="text"
          placeholder="Search keys and values..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.searchInput}
          aria-label="Search JSON tree"
        />
        {searchTerm && (
          <button
            onClick={onClearSearch}
            className={colors.searchClearButton}
            type="button"
            aria-label="Clear search"
          >
            <X className={`w-3 h-3 ${colors.icon}`} />
          </button>
        )}
      </div>
    </div>
  );
};
