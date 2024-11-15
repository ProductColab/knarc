"use client";

import { useKnack } from "@/lib/knack/context";
import { useQuery } from "@tanstack/react-query";
import { getViews } from "@/lib/store";
import { useConfig } from "./useConfig";
import type { KnackViewBase } from "@/lib/knack/types/views";

// Create a base type that includes the common properties we need
interface ViewBase extends Omit<KnackViewBase, "title"> {
  key: string;
  name: string;
  title?: string;
  type: "table" | "form" | "rich_text";
  source?: Record<string, unknown>;
}

// Extend the base type with our additional properties
export interface EnhancedKnackView extends ViewBase {
  sceneName: string;
  sceneKey: string;
  _id: string;
}

export function useViews() {
  const { db, client } = useKnack();
  const { activeConfig } = useConfig();

  return useQuery({
    queryKey: ["views", activeConfig?.id],
    queryFn: async () => {
      if (!client || !activeConfig) {
        console.warn("⚠️ No active client or config in useViews");
        return [];
      }

      console.log("🔍 Fetching views for config:", {
        configId: activeConfig.id,
        applicationId: client.getApplicationId()
      });

      const views = await getViews(db, activeConfig.id);
      console.log(`📊 Retrieved ${views.length} views from DB`);

      if (views.length === 0) {
        console.warn("⚠️ No views found in database for config:", activeConfig.id);
      }

      return views as EnhancedKnackView[];
    },
    enabled: !!client && !!activeConfig,
  });
} 