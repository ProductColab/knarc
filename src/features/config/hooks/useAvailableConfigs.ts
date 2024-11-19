import { useDuckDB } from "@/lib/duckdb";
import { useQuery } from "@tanstack/react-query";
import { fetchAvailableConfigs } from "@/features/config/actions";

export function useAvailableConfigs() {
  const { getConnection, isInitialized } = useDuckDB();

  return useQuery({
    queryKey: ["config", "available"],
    queryFn: async () => {
      if (!isInitialized) return [];
      const conn = await getConnection();
      return fetchAvailableConfigs(conn);
    },
    enabled: isInitialized,
  });
}
