import { useDuckDB } from "@/lib/duckdb";
import { useQuery } from "@tanstack/react-query";
import { fetchAvailableConfigs } from "../actions";
import { CONFIGS_QUERY_KEY } from "./useConfig";

export function useAvailableConfigs() {
  const { getConnection, isInitialized } = useDuckDB();

  return useQuery({
    queryKey: CONFIGS_QUERY_KEY,
    queryFn: async () => {
      const conn = await getConnection();
      return fetchAvailableConfigs(conn);
    },
    enabled: isInitialized,
    staleTime: 30000,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}
