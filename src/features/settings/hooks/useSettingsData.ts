import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDuckDB } from "@/lib/duckdb";
import { fetchSettings, updateSettings } from "../actions";
import { SettingsApplicationId, SettingsUpdate } from "../types";
import { saveDatabase } from "@/lib/duckdb";

export function useSettingsData(applicationId: SettingsApplicationId | null) {
  const { getConnection, isInitialized } = useDuckDB();
  const queryClient = useQueryClient();

  const { data: settings, error, isLoading } = useQuery({
    queryKey: ["settings", applicationId],
    queryFn: async () => {
      if (!applicationId || !isInitialized) return null;
      const conn = await getConnection();
      return fetchSettings(conn, applicationId);
    },
    enabled: !!applicationId && isInitialized,
  });

  const { mutateAsync: updateSettingsMutation } = useMutation({
    mutationFn: async (data: SettingsUpdate) => {
      const conn = await getConnection();
      await updateSettings(conn, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings"] });

      try {
        await saveDatabase();
      } catch (error) {
        console.error("Failed to persist settings to IndexedDB:", error);
      }
    },
  });

  return {
    settings,
    error,
    isLoading,
    updateSettings: updateSettingsMutation,
  };
} 