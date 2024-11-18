"use client";

import { createContext } from "react";
import type { AsyncDuckDB, AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";

export interface DuckDBContextValue {
  db: AsyncDuckDB | null;
  getConnection: () => Promise<AsyncDuckDBConnection>;
}

export const DuckDBContext = createContext<DuckDBContextValue | null>(null);
