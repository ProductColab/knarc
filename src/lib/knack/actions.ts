"use server";

import { cache } from "react";
import { KnackClient } from "./api";
import type { KnackScene, KnackView } from "./types";
import type { KnackApplicationSchema } from "./types/application";
import { cookies } from "next/headers";

// Helper function to get config from cookies
const getKnackConfig = async () => {
  const cookieStore = await cookies();
  const config = cookieStore.get("knack_config");
  if (!config?.value) {
    throw new Error("Knack configuration not found");
  }
  return JSON.parse(config.value);
};

// Initialize client for each request using stored config
const getClient = async () => {
  const config = await getKnackConfig();
  return new KnackClient({
    ...config,
    // Remove apiVersion as we always use v1
    apiVersion: undefined,
  });
};

/**
 * Cached function to get the application schema
 */
export const getApplicationSchema = cache(
  async (): Promise<KnackApplicationSchema> => {
    const client = await getClient();
    return client.getApplicationSchema();
  }
);

/**
 * Cached function to get all scenes
 */
export const getScenes = cache(async (): Promise<KnackScene[]> => {
  const schema = await getApplicationSchema();
  // Ensure authenticated is set to true for all scenes
  return schema.scenes.map((scene) => ({
    ...scene,
    authenticated: scene.authenticated ?? true,
  }));
});

/**
 * Cached function to find a view and its parent scene
 */
export const findViewAndScene = cache(
  async (
    viewKey: string
  ): Promise<{ view: KnackView; scene: KnackScene } | null> => {
    const scenes = await getScenes();

    for (const scene of scenes) {
      const view = scene.views?.find((v) => v.key === viewKey);
      if (view) {
        return { view, scene };
      }
    }

    return null;
  }
);
