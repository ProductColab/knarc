import { useQuery } from "@tanstack/react-query";
import * as duckdb from "@duckdb/duckdb-wasm";
import duckdb_wasm from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";
import mvp_worker from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
import duckdb_wasm_eh from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";
import eh_worker from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";
import { DuckDBClient } from "@/lib/duckdb/client";
import { loadApplicationData } from "@/lib/duckdb/loader";
import type { KnackApplication } from "@/lib/knack/types/application";
import type { DependencyGraph } from "@/lib/deps/graph";

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
  mvp: {
    mainModule: duckdb_wasm,
    mainWorker: mvp_worker,
  },
  eh: {
    mainModule: duckdb_wasm_eh,
    mainWorker: eh_worker,
  },
};

export interface UseDuckDBOptions {
  enableFTS?: boolean;
}

interface DuckDBInstance {
  db: duckdb.AsyncDuckDB;
  client: DuckDBClient;
}

/**
 * Initialize DuckDB instance (cached by TanStack Query)
 */
async function initDuckDB(): Promise<DuckDBInstance> {
  // Select bundle based on browser
  const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);

  // Create worker
  const worker = new Worker(bundle.mainWorker!);
  const logger = new duckdb.ConsoleLogger();

  // Instantiate DuckDB
  const dbInstance = new duckdb.AsyncDuckDB(logger, worker);
  await dbInstance.instantiate(bundle.mainModule, bundle.pthreadWorker);

  const client = new DuckDBClient(dbInstance);

  return { db: dbInstance, client };
}

/**
 * Load application data into DuckDB (cached by TanStack Query)
 */
async function loadDuckDBData(
  instance: DuckDBInstance,
  app: KnackApplication,
  graph: DependencyGraph,
  options: UseDuckDBOptions
): Promise<DuckDBInstance> {
  await loadApplicationData(instance.db, app, graph, {
    enableFTS: options.enableFTS ?? true,
  });
  return instance;
}

export function useDuckDB(
  app: KnackApplication | null | undefined,
  graph: DependencyGraph | null | undefined,
  options: UseDuckDBOptions = {}
) {
  // Initialize DuckDB instance (cached globally)
  const dbQuery = useQuery({
    queryKey: ["duckdb-instance"],
    queryFn: initDuckDB,
    staleTime: Infinity,
    gcTime: Infinity, // Keep instance in cache forever
  });

  // Load data when app and graph are available
  const dataQuery = useQuery({
    queryKey: [
      "duckdb-data",
      app?.id,
      graph ? "graph" : null,
      options.enableFTS,
    ],
    queryFn: async () => {
      if (!dbQuery.data || !app || !graph) {
        throw new Error("DuckDB instance, app, and graph required");
      }
      return loadDuckDBData(dbQuery.data, app, graph, options);
    },
    enabled: Boolean(dbQuery.data && app && graph),
    staleTime: Infinity,
    gcTime: Infinity, // Keep loaded data in cache forever
  });

  return {
    db: dbQuery.data?.db ?? null,
    client: dataQuery.data?.client ?? null,
    loading: dbQuery.isLoading || dataQuery.isLoading,
    error: dbQuery.error || dataQuery.error,
    loaded: dataQuery.isSuccess,
    reload: () => {
      dataQuery.refetch();
    },
  };
}

