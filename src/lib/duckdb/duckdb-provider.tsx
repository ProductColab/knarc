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

import { getDb, isDuckDBPersistenceAvailable } from "./index";
import { type ReactNode, useEffect, useState } from "react";

interface DuckDBProviderProps {
  children: ReactNode;
}

export function DuckDBProvider({ children }: DuckDBProviderProps) {
  const [state, setState] = useState({
    isInitialized: false,
    isLoading: true,
    error: null as Error | null,
    isPersistent: false,
  });

  useEffect(() => {
    async function initializeDB() {
      try {
        const isPersistent = await isDuckDBPersistenceAvailable();
        console.log(
          `📦 Database persistence: ${isPersistent ? "enabled" : "disabled"}`
        );

        await getDb();

        setState((prev) => ({
          ...prev,
          isInitialized: true,
          isPersistent,
          isLoading: false,
        }));
      } catch (err) {
        console.error("Failed to initialize DuckDB:", err);
        setState((prev) => ({
          ...prev,
          error:
            err instanceof Error
              ? err
              : new Error("Failed to initialize DuckDB"),
          isLoading: false,
        }));
      }
    }

    initializeDB();
  }, []);

  const value: DuckDBContextValue = {
    ...state,
    getConnection: async () => {
      const { conn } = await getDb();
      return conn;
    },
  };

  return (
    <DuckDBContext.Provider value={value}>{children}</DuckDBContext.Provider>
  );
}
