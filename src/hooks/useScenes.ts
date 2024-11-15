"use client";

import { useKnack } from "@/lib/knack/context";
import { useQuery } from "@tanstack/react-query";
import { getScenes } from "@/lib/store"

export function useScenes(configId: string) {
  const { db, client } = useKnack();

  return useQuery({
    queryKey: ["scenes", configId],
    queryFn: async () => {
      if (!db || !client) {
        console.warn("Database or client not initialized");
        return [];
      }

      try {
        // First try to get from local DB
        const scenes = await getScenes(db, configId);

        if (scenes.length > 0) {
          return scenes;
        }

        // If no scenes in DB, fetch from API
        const schema = await client.getApplicationSchema();
        return schema.scenes || [];
      } catch (error) {
        console.error("Error fetching scenes:", error);
        return [];
      }
    },
    enabled: !!db && !!client && !!configId,
  });
}
