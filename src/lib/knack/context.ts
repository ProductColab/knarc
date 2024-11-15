"use client";

import { createContext, useContext } from "react";
import type { RxDatabase } from "rxdb";
import { KnackClient } from "./api";

interface KnackContextType {
  db: RxDatabase;
  client: KnackClient | null;
  isInitialized: boolean;
}

export const KnackContext = createContext<KnackContextType | null>(null);

export function useKnack() {
  const context = useContext(KnackContext);
  if (!context) {
    throw new Error("useKnack must be used within a KnackProvider");
  }
  return context;
}
