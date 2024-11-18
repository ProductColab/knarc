"use client";

import { ReactNode } from "react";
import { DuckDBContext, type DuckDBContextValue } from "./context";
import { getDb } from "./index";

export function DynamicDuckDBProvider({ children }: { children: ReactNode }) {
  const value: DuckDBContextValue = {
    db: null,
    getConnection: async () => {
      const { db, conn } = await getDb();
      value.db = db;
      return conn;
    },
  };

  return (
    <DuckDBContext.Provider value={value}>{children}</DuckDBContext.Provider>
  );
}
