"use client";

import { createContext, useContext } from "react";
import type { KnackClient } from "./api";

interface KnackContextValue {
  client: KnackClient;
}

export const KnackContext = createContext<KnackContextValue | null>(null);

export function useKnack() {
  const context = useContext(KnackContext);
  if (!context) {
    throw new Error("useKnack must be used within a KnackProvider");
  }
  return context;
}
