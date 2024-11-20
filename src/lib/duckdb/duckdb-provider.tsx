"use client";
import { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { createContext, useRef } from "react";
import { Loading } from "@/components/ui/loading";
import { getDb, isDuckDBPersistenceAvailable, destroyDatabase } from "./index";
import { type ReactNode, useEffect, useState } from "react";

export interface DuckDBContextValue {
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  isPersistent: boolean;
  status: "idle" | "loading" | "success" | "error";
  getConnection: () => Promise<AsyncDuckDBConnection>;
  destroyDatabase: () => Promise<void>;
}

export const DuckDBContext = createContext<DuckDBContextValue | null>(null);

interface DuckDBProviderProps {
  children: ReactNode;
}

export default function DuckDBProvider({ children }: DuckDBProviderProps) {
  const initializationRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const [state, setState] = useState({
    isInitialized: false,
    isLoading: true,
    error: null as Error | null,
    isPersistent: false,
    status: "idle" as "idle" | "loading" | "success" | "error",
  });

  useEffect(() => {
    async function initializeDB() {
      if (initializationRef.current) return;
      initializationRef.current = true;

      // Set a timeout to catch if initialization takes too long
      timeoutRef.current = setTimeout(() => {
        console.error("⏰ Database initialization timed out after 30 seconds");
        setState((prev) => ({
          ...prev,
          error: new Error("Database initialization timed out"),
          isLoading: false,
          status: "error",
        }));
      }, 30000);

      console.log("🏁 DuckDBProvider: Starting initialization");
      setState((prev) => {
        console.log("⚡ Setting loading state:", {
          ...prev,
          isLoading: true,
          status: "loading",
        });
        return { ...prev, isLoading: true, status: "loading" };
      });

      try {
        console.log("🔍 Checking persistence availability...");
        const isPersistent = await isDuckDBPersistenceAvailable();
        console.log(
          `📦 Database persistence: ${isPersistent ? "enabled" : "disabled"}`
        );

        console.log("📡 Calling getDb()...");
        const { status } = await getDb();
        console.log("✅ getDb() completed with status:", status);

        // Clear timeout on success
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        setState((prev) => ({
          ...prev,
          isInitialized: true,
          isPersistent,
          isLoading: false,
          status,
        }));
      } catch (err) {
        // Clear timeout on error
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        console.error("💥 Failed to initialize DuckDB:", err);
        setState((prev) => ({
          ...prev,
          error:
            err instanceof Error
              ? err
              : new Error("Failed to initialize DuckDB"),
          isLoading: false,
          status: "error",
        }));
      }
    }

    initializeDB();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const value: DuckDBContextValue = {
    ...state,
    destroyDatabase,
    getConnection: async () => {
      const { conn } = await getDb();
      return conn;
    },
  };

  if (state.isLoading) {
    return <Loading message="Initializing database..." />;
  }

  if (state.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
        <p className="text-destructive">Failed to initialize database</p>
        <p className="text-sm text-muted-foreground">{state.error.message}</p>
      </div>
    );
  }

  return (
    <DuckDBContext.Provider value={value}>{children}</DuckDBContext.Provider>
  );
}
