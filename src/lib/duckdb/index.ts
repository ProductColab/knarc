import { AsyncDuckDB, AsyncDuckDBConnection, DuckDBConfig } from "@duckdb/duckdb-wasm";
import { useContext } from "react";
import { DuckDBContext } from "./context";

// Core database handles
let connection: AsyncDuckDBConnection | null = null;
let db: AsyncDuckDB | null = null;

// Configuration
const DUCKDB_CONFIG: DuckDBConfig = {
  query: {
    castBigIntToDouble: true
  }
};

// Add CDN URLs for production
const DUCKDB_CDN = {
  mvp: {
    mainModule: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm',
    mainWorker: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js',
  },
  eh: {
    mainModule: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm/dist/duckdb-eh.wasm',
    mainWorker: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js',
  },
};

const DUCKDB_BUNDLES = process.env.NODE_ENV === 'production'
  ? DUCKDB_CDN
  : {
    mvp: {
      mainModule: '/duckdb-mvp.wasm',
      mainWorker: '/duckdb-browser-mvp.worker.js',
    },
    eh: {
      mainModule: '/duckdb-eh.wasm',
      mainWorker: '/duckdb-browser-eh.worker.js',
    },
  };

// Database state tracking
let isInitialized = false;
let initializationPromise: Promise<AsyncDuckDBConnection> | null = null;

// IndexedDB helpers
class IndexedDBHelper {
  private static DB_NAME = 'SettingsDB';
  private static STORE_NAME = 'database';
  private static DB_VERSION = 1;

  static async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
        }
      };
    });
  }

  static async save(buffer: Uint8Array): Promise<void> {
    const idb = await this.openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = idb.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(buffer, 'dbBuffer');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  static async load(): Promise<Uint8Array | null> {
    const idb = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = idb.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get('dbBuffer');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  static async clear(): Promise<void> {
    const idb = await this.openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = idb.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Table operations
class TableOperations {
  static async serialize(conn: AsyncDuckDBConnection): Promise<Uint8Array> {
    try {
      const result = await conn.query(`
        SELECT application_id, settings 
        FROM settings
      `);
      const data = result.toArray().map(row => row.toJSON());
      const jsonStr = JSON.stringify(data);
      console.log("📝 Serialized data:", jsonStr);
      return new TextEncoder().encode(jsonStr);
    } catch (error) {
      console.error("❌ Error serializing table:", error);
      throw error;
    }
  }

  static async restore(conn: AsyncDuckDBConnection, data: Uint8Array) {
    try {
      const jsonStr = new TextDecoder().decode(data);
      console.log("📄 Decoded data:", jsonStr);

      if (!jsonStr.trim().startsWith('[')) {
        throw new Error("Invalid JSON data format");
      }

      const rows = JSON.parse(jsonStr);
      console.log("📊 Parsed rows:", rows);

      if (!Array.isArray(rows)) {
        throw new Error("Data is not an array");
      }

      for (const row of rows) {
        if (!row.application_id || !row.settings) {
          console.error("❌ Invalid row format:", row);
          continue;
        }

        const query = `
          INSERT INTO settings (application_id, settings)
          VALUES ('${row.application_id}', '${row.settings}')
          ON CONFLICT (application_id) DO UPDATE 
          SET settings = EXCLUDED.settings;
        `;
        console.log("🔄 Executing query:", query);
        await conn.query(query);
      }
    } catch (error) {
      console.error("❌ Error restoring table:", error);
      throw error;
    }
  }
}

// Database initialization
async function initializeDatabase(): Promise<AsyncDuckDBConnection> {
  if (connection) {
    return connection;
  }

  const worker = new Worker(DUCKDB_BUNDLES.eh.mainWorker);
  const logger = {
    log: (msg: string | number | object) => console.log(msg),
    error: (msg: string | number | object) => console.error(msg)
  };

  db = new AsyncDuckDB(logger, worker);
  await db.instantiate(DUCKDB_BUNDLES.eh.mainModule);
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
      const savedBuffer = await IndexedDBHelper.load();
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
      await IndexedDBHelper.clear();
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

    await IndexedDBHelper.save(buffer);
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
