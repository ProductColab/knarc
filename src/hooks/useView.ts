"use client";

import { useKnack } from "@/lib/knack/context";
import { useQuery } from "@tanstack/react-query";
import { getScenes } from "@/lib/store";
import type { KnackView } from "@/lib/knack/types/views";

export function useView(configId: string, viewKey: string) {
  const { db } = useKnack();

  const { data, isLoading: loading, error } = useQuery({
    queryKey: ["view", configId, viewKey],
    queryFn: async () => {
      const scenes = await getScenes(db, configId);

      for (const scene of scenes) {
        const view = scene.views?.find((view: KnackView) => view.key === viewKey);
        if (view) {
          return { view, scene };
        }
      }
      return null;
    },
    enabled: !!viewKey && !!configId,
  });

  return {
    view: data?.view ?? null,
    scene: data?.scene ?? null,
    loading,
    error,
  };
}
