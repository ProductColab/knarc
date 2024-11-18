import { useEffect, useState, useCallback } from "react";
import { useDuckDB } from "../duckdb-provider";

export interface QueryResult<T = unknown> {
  data: T[] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface QueryOptions {
  enabled?: boolean;
}

export function useQuery<T = unknown>(
  query: string,
  options: QueryOptions = {}
): QueryResult<T> {
  const { getConnection } = useDuckDB();
  const [state, setState] = useState<{
    data: T[] | null;
    isLoading: boolean;
    error: Error | null;
  }>({
    data: null,
    isLoading: false,
    error: null
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const conn = await getConnection();
      const result = await conn.query(query);
      const rows = result.toArray().map(row => row.toJSON() as T);
      setState({ data: rows, isLoading: false, error: null });
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err : new Error(String(err)),
        isLoading: false
      }));
    }
  }, [query, getConnection]);

  useEffect(() => {
    if (options.enabled !== false) {
      fetchData();
    }
  }, [fetchData, options.enabled]);

  return {
    ...state,
    refetch: fetchData
  };
}
