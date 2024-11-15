"use client";

import { useKnack } from "@/lib/knack/context";
import { useQuery } from "@tanstack/react-query";
import { getObjects } from "@/lib/store";

export function useObjects(configId: string) {
  const { db, client } = useKnack();

  return useQuery({
    queryKey: ["objects", configId],
    queryFn: async () => {
      if (!db || !client) {
        console.warn("Database or client not initialized");
        return [];
      }

      try {
        // First try to get from local DB
        const objects = await getObjects(db, configId);

        if (objects.length > 0) {
          return objects;
        }

        // If no objects in DB, fetch from API
        const schema = await client.getApplicationSchema();
        return schema.objects || [];
      } catch (error) {
        console.error("Error fetching objects:", error);
        return [];
      }
    },
    enabled: !!db && !!client && !!configId,
  });
} 