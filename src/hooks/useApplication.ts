"use client";

import { useKnack } from "@/lib/knack/context";
import { useQuery } from "@tanstack/react-query";
import { getApplication, upsertApplication } from "@/lib/store";
import { useCallback } from "react";
import type { KnackApplicationSchema } from "@/lib/knack/types/application";

export function useApplication() {
  const { db, client } = useKnack();

  // Fetch application schema from API and update local store
  const fetchAndStoreSchema = useCallback(async () => {
    if (!client) throw new Error("No active client");

    const schema = await client.getApplicationSchema();
    if (!schema) return null;

    // Store in local DB
    const application = await upsertApplication(
      db,
      schema as KnackApplicationSchema,
      client.getApplicationId()
    );
    return application;
  }, [client, db]);

  // Query both local and remote data
  const { data: application, error, isLoading } = useQuery({
    queryKey: ["application", client?.getApplicationId()],
    queryFn: async () => {
      if (!client) return null;

      // First try to get from local DB
      const localApp = await getApplication(db, client.getApplicationId());

      if (localApp) {
        const isFresh = Date.now() - localApp.updatedAt < 1000 * 60 * 5; // 5 minutes
        if (isFresh) {
          return localApp;
        }
        // Refresh in background if stale
        fetchAndStoreSchema().catch(console.error);
        return localApp;
      }

      // If no local data, wait for API response
      return await fetchAndStoreSchema();
    },
    enabled: !!client,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  return {
    application,
    error,
    isLoading,
  };
}
