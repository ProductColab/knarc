import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDuckDB } from "@/lib/duckdb";
import { fetchConfig, updateConfig } from "@/features/config/actions";
import { Config, ConfigUpdate } from "@/features/config/types";
import { saveDatabase } from "@/lib/duckdb";

export const CONFIGS_QUERY_KEY = ["configs"] as const;

export function useConfig(configId: Config["id"] | null) {
  const { getConnection, isInitialized } = useDuckDB();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...CONFIGS_QUERY_KEY, configId],
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
      const result = await updateConfig(conn, data);

      // Save to IndexedDB after successful update
      try {
        await saveDatabase();
      } catch (error) {
        console.error("Failed to persist config to IndexedDB:", error);
      }

      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CONFIGS_QUERY_KEY });
    },
  });

  return {
    ...query,
    config: query.data,
    updateConfig: updateConfigMutation,
  };
}
