import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDuckDB } from "@/lib/duckdb";
import { fetchConfig, updateConfig } from "@/features/config/actions";
import { ConfigId, ConfigUpdate } from "@/features/config/types";
import { saveDatabase } from "@/lib/duckdb";

export function useConfig(configId: ConfigId | null) {
  const { getConnection, isInitialized } = useDuckDB();
  const queryClient = useQueryClient();

  const { data: config, error, isLoading } = useQuery({
    queryKey: ["config", configId],
    queryFn: async () => {
      if (!configId || !isInitialized) return null;
      const conn = await getConnection();
      return fetchConfig(conn, configId);
    },
    enabled: !!configId && isInitialized,
  });

  const { mutateAsync: updateConfigMutation } = useMutation({
    mutationFn: async (data: ConfigUpdate) => {
      const conn = await getConnection();
      return updateConfig(conn, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["config"] });
      try {
        await saveDatabase();
      } catch (error) {
        console.error("Failed to persist config to IndexedDB:", error);
      }
    },
  });

  return {
    config,
    error,
    isLoading,
    updateConfig: updateConfigMutation,
  };
}
