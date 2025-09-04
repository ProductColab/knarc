import React from "react";
import type { FooterProps } from "./types";
import { createStyles } from "./utils";

export const Footer: React.FC<FooterProps> = ({ searchTerm, theme }) => {
  if (!searchTerm) return null;

  const styles = createStyles(theme);

  return (
    <div className={styles.footer}>
      Searching for:{" "}
      <span className="font-semibold">&quot;{searchTerm}&quot;</span>
    </div>
  );
};
