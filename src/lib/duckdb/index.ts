import type { DuckDBBundles } from "@duckdb/duckdb-wasm";
import { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import * as duckdb from "@duckdb/duckdb-wasm";

interface DBInstance {
  db: AsyncDuckDB;
  conn: Awaited<ReturnType<AsyncDuckDB['connect']>>;
}

// Initialize database client with logging
const initializeDatabase = async (): Promise<DBInstance> => {
  console.log('🔌 Initializing DuckDB...');

  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log('⚠️ Running in Edge runtime...');
      throw new Error('DuckDB-WASM requires a browser environment');
    }

    // Get the current origin for absolute URLs
    const origin = window.location.origin;

    // Browser initialization with Web Workers
    const DUCKDB_BUNDLES: DuckDBBundles = {
      mvp: {
        mainModule: `${origin}/duckdb-mvp.wasm`,
        mainWorker: `${origin}/duckdb-browser-mvp.worker.js`,
      },
      eh: {
        mainModule: `${origin}/duckdb-eh.wasm`,
        mainWorker: `${origin}/duckdb-browser-eh.worker.js`,
      }
    };

    // Select the appropriate bundle based on the environment
    const bundle = await duckdb.selectBundle(DUCKDB_BUNDLES);

    if (!bundle.mainWorker) {
      throw new Error('Failed to load DuckDB WASM bundle');
    }

    // Create a new database instance
    const logger = new duckdb.ConsoleLogger();
    const worker = new Worker(bundle.mainWorker);

    // Add error handler to worker
    worker.onerror = (e) => {
      console.error('DuckDB Worker error:', e);
    };

    const db = new AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule);

    // Create a connection
    const conn = await db.connect();
    console.log('✅ DuckDB initialized successfully (browser mode)');
    return { db, conn };
  } catch (error) {
    console.error('❌ Failed to initialize DuckDB:', error);
    throw error;
  }
};

let dbPromise: Promise<DBInstance> | null = null;

// Create database instance with error handling
export const getDb = async () => {
  // Return early if not in browser environment
  if (typeof window === 'undefined') {
    throw new Error('DuckDB can only be initialized in a browser environment');
  }

  if (!dbPromise) {
    dbPromise = initializeDatabase();
  }
  return dbPromise;
};
