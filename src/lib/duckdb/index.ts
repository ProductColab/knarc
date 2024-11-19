import * as duckdb from '@duckdb/duckdb-wasm';
import { AsyncDuckDB, AsyncDuckDBConnection, DuckDBConfig } from "@duckdb/duckdb-wasm";
import { useContext } from "react";
import { DuckDBContext } from "./duckdb-provider";
import { SettingsDB } from '../indexeddb';
import { TableOperations } from './utils/table-operations';

// Core database handles
let connection: AsyncDuckDBConnection | null = null;
let db: AsyncDuckDB | null = null;

// Configuration
const DUCKDB_CONFIG: DuckDBConfig = {
  query: {
    castBigIntToDouble: true
  }
};

// Database state tracking
let isInitialized = false;
let initializationPromise: Promise<AsyncDuckDBConnection> | null = null;

// Database initialization
async function initializeDatabase(): Promise<AsyncDuckDBConnection> {
  if (connection) {
    return connection;
  }

  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

  const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker!}");`], { type: 'text/javascript' })
  );

  const worker = new Worker(worker_url);
  const logger = new duckdb.ConsoleLogger();
  db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(worker_url);

  await db.open({
    query: DUCKDB_CONFIG.query
  });

  connection = await db.connect();

  await connection.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      application_id TEXT UNIQUE,
      settings JSON
    )
  `);

  if (!isInitialized) {
    try {
      const savedBuffer = await SettingsDB.load();
      if (savedBuffer) {
        console.log("📂 Found saved data in IndexedDB");
        console.log("📄 Buffer size:", savedBuffer.byteLength, "bytes");
        await TableOperations.restore(connection, savedBuffer);
        console.log("📥 Data restored successfully");
      } else {
        console.log("❌ No saved data found, starting fresh");
      }
    } catch (err) {
      console.error("⚠️ Error loading saved data:", err);
      await SettingsDB.clear();
    }
    isInitialized = true;
  }

  return connection;
}

// Public API
export async function getDb() {
  try {
    if (initializationPromise) {
      const conn = await initializationPromise;
      return { conn };
    }

    if (!isInitialized) {
      initializationPromise = initializeDatabase();
      const conn = await initializationPromise;
      initializationPromise = null;
      return { conn };
    }

    if (connection) {
      return { conn: connection };
    }

    throw new Error("Database initialization failed");
  } catch (error) {
    console.error("💥 Failed to initialize DuckDB:", error);
    throw error;
  }
}

export async function saveDatabase() {
  if (!db || !connection) {
    console.log("❌ Cannot save database: missing required handles");
    return false;
  }

  try {
    console.log("💾 Starting data save...");
    const buffer = await TableOperations.serialize(connection);
    console.log("📦 Data buffer size:", buffer.byteLength, "bytes");

    await SettingsDB.save(buffer);
    console.log("✅ Data saved to IndexedDB successfully");

    return true;
  } catch (error) {
    console.error("💥 Failed to save database:", error);
    return false;
  }
}

export async function isDuckDBPersistenceAvailable() {
  try {
    return !!window.indexedDB;
  } catch (error) {
    console.error("DuckDB persistence check failed:", error);
    return false;
  }
}

export function useDuckDB() {
  const context = useContext(DuckDBContext);
  if (!context) {
    throw new Error("useDuckDB must be used within a DuckDBProvider");
  }
  return context;
}
