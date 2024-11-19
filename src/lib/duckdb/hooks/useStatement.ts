import { useEffect, useRef, useState, useCallback } from "react";
import { AsyncPreparedStatement } from "@duckdb/duckdb-wasm";
import { getDb } from "../index";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export interface StatementState {
  statement: AsyncPreparedStatement | null;
  isLoading: boolean;
  error: Error | null;
  retry: () => Promise<void>;
}

export function useStatement(query: string): StatementState {
  const [state, setState] = useState<Omit<StatementState, "retry">>({
    statement: null,
    isLoading: true,
    error: null,
  });
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);

  const prepare = useCallback(async () => {
    if (!mountedRef.current) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { conn } = await getDb();
      const preparedStatement = await conn.prepare(query);

      if (mountedRef.current) {
        setState({
          statement: preparedStatement,
          isLoading: false,
          error: null,
        });
        retryCountRef.current = 0;
      } else {
        // Clean up if component unmounted during preparation
        await preparedStatement.close();
      }
    } catch (error) {
      if (!mountedRef.current) return;

      const formattedError =
        error instanceof Error ? error : new Error(String(error));

      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1;
        setTimeout(prepare, RETRY_DELAY * retryCountRef.current);
      } else {
        setState({
          statement: null,
          isLoading: false,
          error: formattedError,
        });
      }
    }
  }, [query]);

  useEffect(() => {
    mountedRef.current = true;
    prepare();

    return () => {
      mountedRef.current = false;
      if (state.statement) {
        state.statement.close().catch(console.error);
      }
    };
  }, [prepare, state.statement]);

  return {
    ...state,
    retry: prepare,
  };
}
