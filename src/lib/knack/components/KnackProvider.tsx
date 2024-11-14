"use client";
import { type ReactNode, useEffect, useState } from "react";
import { KnackContext } from "../context";
import { KnackClient } from "../api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { KnackConfig } from "../types/config";
import { useRouter } from "next/navigation";

interface KnackProviderProps {
  children: ReactNode;
  config?: KnackConfig; // Make config optional
}

export function KnackProvider({ children, config }: KnackProviderProps) {
  const router = useRouter();
  const [knackConfig, setKnackConfig] = useState<KnackConfig | null>(
    config ?? null
  );

  useEffect(() => {
    // Try to load config from localStorage
    const storedConfig = localStorage.getItem("knack_config");
    if (storedConfig) {
      setKnackConfig(JSON.parse(storedConfig));
    } else if (!config) {
      // Redirect to config page if no configuration is found
      router.push("/config");
    }
  }, [config, router]);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
      },
    },
  });

  if (!knackConfig) {
    return null; // Or a loading state
  }

  const client = new KnackClient(knackConfig);

  return (
    <QueryClientProvider client={queryClient}>
      <KnackContext.Provider value={{ client }}>
        {children}
      </KnackContext.Provider>
    </QueryClientProvider>
  );
}
