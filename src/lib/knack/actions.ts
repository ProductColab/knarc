import { useQuery } from "@tanstack/react-query";
import { KnackClient } from "./api";
import type { KnackScene, KnackView } from "./types";
import type { KnackApplicationSchema } from "./types/application";
import { RxDatabase } from "rxdb";
import { getActiveConfig, getApplication, upsertApplication } from "@/lib/store";

// Initialize client using active config from RxDB
const getClient = async (db: RxDatabase) => {
  const config = await getActiveConfig(db);
  if (!config) {
    throw new Error("No active configuration found");
  }
  return new KnackClient(config);
};

/**
 * Hook to get the application schema
 * First tries to load from RxDB cache, then fetches from API if needed
 */
export function useApplicationSchema(db: RxDatabase) {
  return useQuery<KnackApplicationSchema>({
    queryKey: ["applicationSchema"],
    queryFn: async () => {
      console.log("🔍 Fetching application schema...");
      const config = await getActiveConfig(db);
      if (!config) {
        console.warn("⚠️ No active configuration found");
        throw new Error("No active configuration found");
      }
      console.log("📋 Active config:", config);

      // Try to get from cache first
      const cached = await getApplication(db, config.applicationId);
      if (cached) {
        const isFresh = Date.now() - cached.updatedAt < 1000 * 60 * 5;
        if (isFresh) {
          console.log("✨ Using cached schema");
          return cached;
        }
        console.log("🕒 Cache expired, fetching fresh data");
      } else {
        console.log("🔄 No cached schema found, fetching fresh data");
      }

      // // If we don't have an API key, we can't fetch fresh data
      // if (!config.apiKey) {
      //   console.warn("⚠️ No API key available to fetch fresh schema");
      //   throw new Error("API key required to fetch application schema");
      // }

      // Fetch fresh data
      const client = await getClient(db);
      const schema = await client.getApplicationSchema();
      console.log("📥 Fetched fresh schema:", schema);

      // Cache the result
      await upsertApplication(db, schema, config.id);
      console.log("💾 Cached schema");

      return schema;
    },
    retry: false, // Don't retry if we get an error
    staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
  });
}

/**
 * Hook to get all scenes
 */
export function useScenes(db: RxDatabase, configId: string) {
  const { data: schema, error: schemaError, isLoading } = useApplicationSchema(db);

  return useQuery<KnackScene[]>({
    queryKey: ["scenes", configId],
    queryFn: async () => {
      console.log("🎬 Fetching scenes for configId:", configId);

      if (schemaError) {
        console.error("❌ Schema error:", schemaError);
        throw schemaError;
      }

      if (!schema) {
        console.warn("⚠️ No schema available");
        return [];
      }

      if (!schema.scenes) {
        console.warn("⚠️ Schema has no scenes");
        return [];
      }

      const scenes = schema.scenes.map((scene) => ({
        ...scene,
        authenticated: scene.authenticated ?? true,
      }));

      console.log(`✅ Found ${scenes.length} scenes:`, scenes);
      return scenes;
    },
    enabled: !isLoading,
  });
}

/**
 * Hook to find a view and its parent scene
 */
export function useViewAndScene(db: RxDatabase, configId: string, viewKey: string) {
  const { data: scenes } = useScenes(db, configId);

  return useQuery<{ view: KnackView; scene: KnackScene } | null>({
    queryKey: ["view", viewKey],
    queryFn: async () => {
      if (!scenes) return null;

      for (const scene of scenes) {
        const view = scene.views?.find((v) => v.key === viewKey);
        if (view) {
          return { view, scene };
        }
      }
      return null;
    },
    enabled: !!scenes && !!viewKey,
  });
}

// Non-hook functions for direct data access
export async function getViewAndScene(db: RxDatabase, viewKey: string) {
  const client = await getClient(db);
  const schema = await client.getApplicationSchema();

  for (const scene of schema.scenes) {
    const view = scene.views?.find((v) => v.key === viewKey);
    if (view) {
      return { view, scene };
    }
  }
  return null;
}

export async function getAllScenes(db: RxDatabase) {
  const client = await getClient(db);
  const schema = await client.getApplicationSchema();

  return schema.scenes.map((scene) => ({
    ...scene,
    authenticated: scene.authenticated ?? true,
  }));
}

export async function getSchema(db: RxDatabase) {
  const client = await getClient(db);
  return client.getApplicationSchema();
}
