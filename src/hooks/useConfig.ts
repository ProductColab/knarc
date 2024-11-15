"use client";

import { useKnack } from "@/lib/knack/context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ConfigDocument, ConfigDocType } from "@/lib/store";
import {
  getConfigs,
  getActiveConfig,
  setActiveConfig,
  insertConfig,
  updateConfig,
} from "@/lib/store";

export function useConfig() {
  const { db } = useKnack();
  const queryClient = useQueryClient();

  // Get all configs
  const {
    data: configs = [],
    isLoading,
    error,
  } = useQuery<ConfigDocument[]>({
    queryKey: ["configs"],
    queryFn: () => getConfigs(db),
  });

  // Get active config
  const { data: activeConfig } = useQuery<ConfigDocument | null>({
    queryKey: ["activeConfig"],
    queryFn: () => getActiveConfig(db),
  });

  // Create new config
  const createMutation = useMutation({
    mutationFn: (config: Omit<ConfigDocType, "id" | "createdAt" | "updatedAt">) =>
      insertConfig(db, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configs"] });
      queryClient.invalidateQueries({ queryKey: ["activeConfig"] });
    },
  });

  // Update existing config
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      config,
    }: {
      id: string;
      config: Partial<ConfigDocType>;
    }) => updateConfig(db, id, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configs"] });
      queryClient.invalidateQueries({ queryKey: ["activeConfig"] });
    },
  });

  // Set active config
  const setActiveMutation = useMutation({
    mutationFn: (configId: string) => setActiveConfig(db, configId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configs"] });
      queryClient.invalidateQueries({ queryKey: ["activeConfig"] });
    },
  });

  return {
    configs,
    activeConfig,
    isLoading,
    error,
    createConfig: createMutation.mutateAsync,
    updateConfig: updateMutation.mutateAsync,
    setActiveConfig: setActiveMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isSettingActive: setActiveMutation.isPending,
  };
}