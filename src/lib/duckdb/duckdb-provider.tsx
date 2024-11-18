"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

interface DuckDBProviderProps {
  children: ReactNode;
}

// Dynamically import the provider component
export const DuckDBProvider = dynamic<DuckDBProviderProps>(
  () => import("./dynamic-provider").then((mod) => mod.DynamicDuckDBProvider),
  {
    ssr: false,
    loading: () => <div>Loading DuckDB...</div>,
  }
);

// Re-export the hook from the context file
export { useDuckDB } from "./use-duckdb";
