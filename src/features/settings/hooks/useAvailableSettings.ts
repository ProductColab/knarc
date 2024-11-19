import { useDuckDB } from "@/lib/duckdb";
import { useQuery } from "@tanstack/react-query";
import { fetchAvailableSettings } from "../actions";

export function useAvailableSettings() {
  const { getConnection, isInitialized } = useDuckDB();

  return useQuery({
    queryKey: ["settings", "available"],
    queryFn: async () => {
      if (!isInitialized) return [];
      const conn = await getConnection();
      return fetchAvailableSettings(conn);
    },
    enabled: isInitialized,
  });
}
