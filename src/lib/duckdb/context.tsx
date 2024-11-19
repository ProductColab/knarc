"use client";

import { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { createContext } from "react";

export interface DuckDBContextValue {
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  isPersistent: boolean;
  getConnection: () => Promise<AsyncDuckDBConnection>;
}

export const DuckDBContext = createContext<DuckDBContextValue | null>(null);
