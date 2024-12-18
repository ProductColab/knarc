import { useContext } from "react";
import { DuckDBContext } from "../duckdb-provider";
import { Transaction } from "../../indexeddb";
import { AsyncPreparedStatement } from "@duckdb/duckdb-wasm";

export interface QueryResult<T = unknown> {
  data: T[];
  error: Error | null;
}

export interface QueryState<T = unknown> extends QueryResult<T> {
  isLoading: boolean;
  retry: () => Promise<QueryState<T>>;
}

export interface DatabaseOperations {
  query: <T = unknown>(sql: string, params?: unknown[]) => Promise<QueryResult<T>>;
  execute: (sql: string, params?: unknown[]) => Promise<void>;
  transaction: <T>(
    operations: (transaction: Transaction) => Promise<T>
  ) => Promise<T>;
  preparedQuery: <T = unknown>(
    sql: string,
    params?: unknown[]
  ) => Promise<QueryState<T>>;
}

async function prepareAndExecute(
  statement: AsyncPreparedStatement,
  params?: unknown[]
) {
  if (params && params.length > 0) {
    return statement.query(params);
  }
  return statement.query();
}

export function useDB(): DatabaseOperations {
  const context = useContext(DuckDBContext);

  if (!context) {
    throw new Error("useDatabase must be used within a DuckDBProvider");
  }

  const { getConnection } = context;

  return {
    query: async <T = unknown>(
      sql: string,
      params?: unknown[]
    ): Promise<QueryResult<T>> => {
      try {
        const conn = await getConnection();
        const statement = await conn.prepare(sql);
        const result = await prepareAndExecute(statement, params);
        await statement.close();

        return {
          data: result.toArray() as T[],
          error: null,
        };
      } catch (err) {
        return {
          data: [],
          error: err instanceof Error ? err : new Error(String(err)),
        };
      }
    },

    execute: async (sql: string, params?: unknown[]): Promise<void> => {
      const conn = await getConnection();
      const statement = await conn.prepare(sql);
      await prepareAndExecute(statement, params);
      await statement.close();
    },

    transaction: async <T>(
      operations: (transaction: Transaction) => Promise<T>
    ): Promise<T> => {
      const conn = await getConnection();
      await conn.query("BEGIN TRANSACTION");

      const transaction: Transaction = {
        execute: async (sql: string, params?: unknown[]) => {
          const statement = await conn.prepare(sql);
          await prepareAndExecute(statement, params);
          await statement.close();
        },
        commit: async () => {
          await conn.query("COMMIT");
        },
        rollback: async () => {
          await conn.query("ROLLBACK");
        },
      };

      try {
        const result = await operations(transaction);
        await transaction.commit();
        return result;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    },

    preparedQuery: async <T = unknown>(
      sql: string,
      params?: unknown[]
    ): Promise<QueryState<T>> => {
      const retryCount = 3;
      const retryDelay = 1000;

      const executeQuery = async (attempt: number = 0): Promise<QueryState<T>> => {
        try {
          const conn = await getConnection();
          const statement = await conn.prepare(sql);
          const result = await prepareAndExecute(statement, params);
          await statement.close();

          return {
            data: result.toArray() as T[],
            error: null,
            isLoading: false,
            retry: () => executeQuery(),
          };
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));

          if (attempt < retryCount) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
            return executeQuery(attempt + 1);
          }

          return {
            data: [],
            error,
            isLoading: false,
            retry: () => executeQuery(),
          };
        }
      };

      return {
        data: [],
        error: null,
        isLoading: true,
        retry: () => executeQuery(),
      };
    },
  };
}
