"use client";

import { useKnack } from "@/lib/knack/context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ConfigDocument } from "@/lib/store";
import { getConfigs, getActiveConfig, setActiveConfig } from "@/lib/store";

export function useConfig() {
  console.log("🔄 useConfig hook called");
  const { db } = useKnack();
  const queryClient = useQueryClient();

  // Get all configs
  const {
    data: configs = [],
    isLoading,
    error,
  } = useQuery<ConfigDocument[]>({
    queryKey: ["configs"],
    queryFn: async () => {
      console.log("📥 Fetching configs from DB");
      const result = await getConfigs(db);
      console.log("📤 Fetched configs:", result.length);
      return result;
    },
  });

  // Get active config
  const { data: activeConfig } = useQuery<ConfigDocument | null>({
    queryKey: ["activeConfig"],
    queryFn: async () => {
      console.log("🎯 Fetching active config");
      const result = await getActiveConfig(db);
      console.log("📍 Active config:", result?.id);
      return result;
    },
  });

  // Set active config
  const setActiveMutation = useMutation({
    mutationFn: async (configId: string) => {
      console.log("⚡ Setting active config:", configId);
      const result = await setActiveConfig(db, configId);
      console.log("✅ Active config set:", result);
      return result;
    },
    onSuccess: () => {
      console.log("🔄 Invalidating queries after config change");
      queryClient.invalidateQueries({ queryKey: ["configs"] });
      queryClient.invalidateQueries({ queryKey: ["activeConfig"] });
    },
  });

  console.log("📊 useConfig state:", {
    configsCount: configs.length,
    activeConfigId: activeConfig?.id,
    isLoading,
    hasError: !!error,
  });

  return {
    configs,
    activeConfig,
    isLoading,
    error,
    setActiveConfig: setActiveMutation.mutateAsync,
    isSettingActive: setActiveMutation.isPending,
  };
}
