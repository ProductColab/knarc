import * as duckdb from '@duckdb/duckdb-wasm';
import { AsyncDuckDB, AsyncDuckDBConnection, DuckDBConfig } from "@duckdb/duckdb-wasm";
import { useContext } from "react";
import { DuckDBContext } from "./duckdb-provider";
import { SettingsDB } from '../indexeddb';
import { TableOperations } from './utils/table-operations';
import { SchemaManager } from "./utils/schema-manager";

class DuckDBManager {
  private static connection: AsyncDuckDBConnection | null = null;
  private static db: AsyncDuckDB | null = null;
  private static isInitialized = false;
  private static initializationPromise: Promise<AsyncDuckDBConnection> | null = null;
  private static initializationStatus: 'idle' | 'loading' | 'success' | 'error' = 'idle';

  private static readonly CONFIG: DuckDBConfig = {
    query: {
      castBigIntToDouble: true
    }
  };

  private static async createDatabase(): Promise<AsyncDuckDBConnection> {
    console.log("🏗️ Creating new database instance...");

    let worker: Worker | null = null;
    let worker_url: string | null = null;

    try {
      console.log("📦 Loading DuckDB bundle...");
      const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles());

      console.log("👷 Creating Web Worker...");
      worker_url = URL.createObjectURL(
        new Blob([`importScripts("${bundle.mainWorker!}");`], { type: 'text/javascript' })
      );

      worker = new Worker(worker_url);
      const logger = new duckdb.ConsoleLogger();

      console.log("🏗️ Instantiating DuckDB...");
      this.db = new duckdb.AsyncDuckDB(logger, worker);
      await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker);

      if (worker_url) {
        URL.revokeObjectURL(worker_url);
        worker_url = null;
      }

      console.log("🔓 Opening database...");
      await this.db.open({
        query: this.CONFIG.query
      });

      console.log("🔌 Creating connection...");
      this.connection = await this.db.connect();

      return this.connection;
    } catch (error) {
      // Clean up resources
      if (worker_url) {
        URL.revokeObjectURL(worker_url);
      }
      if (worker) {
        worker.terminate();
      }
      throw error;
    }
  }

  private static async initializeDatabase(): Promise<AsyncDuckDBConnection> {
    console.log("🚀 Starting database initialization...");

    try {
      // Create fresh database instance
      const conn = await this.createDatabase();

      // Initialize schema
      await SchemaManager.initializeSchema(conn);

      // Try to restore data if available
      try {
        const savedBuffer = await SettingsDB.load();
        if (savedBuffer) {
          console.log("📂 Found saved data in IndexedDB");
          await TableOperations.restore(conn, savedBuffer);
          console.log("📥 Data restored successfully");
        }
      } catch (error) {
        console.error("⚠️ Failed to restore data:", error);
        await SettingsDB.clear();
      }

      this.isInitialized = true;
      console.log("✅ Database initialization complete!");
      return conn;
    } catch (error) {
      console.error("💥 Critical initialization error:", error);
      this.cleanup();
      throw error;
    }
  }

  private static cleanup() {
    if (this.connection) {
      try {
        this.connection.close();
      } catch (e) {
        console.warn("Failed to close connection:", e);
      }
    }

    if (this.db) {
      try {
        this.db.terminate();
      } catch (e) {
        console.warn("Failed to terminate database:", e);
      }
    }

    this.db = null;
    this.connection = null;
    this.isInitialized = false;
  }

  public static async getConnection() {
    try {
      console.log("🔄 Current initialization status:", this.initializationStatus);

      if (this.initializationStatus === 'loading' && this.initializationPromise) {
        console.log("⏳ Waiting for existing initialization...");
        return { conn: await this.initializationPromise, status: this.initializationStatus };
      }

      if (!this.isInitialized || !this.connection) {
        console.log("🎬 Starting new initialization...");
        this.initializationStatus = 'loading';
        this.initializationPromise = this.initializeDatabase();

        try {
          const conn = await this.initializationPromise;
          this.initializationStatus = 'success';
          this.initializationPromise = null;
          return { conn, status: this.initializationStatus };
        } catch (error) {
          this.initializationStatus = 'error';
          this.initializationPromise = null;
          throw error;
        }
      }

      return { conn: this.connection, status: this.initializationStatus };
    } catch (error) {
      this.initializationStatus = 'error';
      console.error("💥 Failed to get connection:", error);
      throw error;
    }
  }

  public static async saveDatabase() {
    if (!this.connection) {
      console.log("❌ Cannot save database: no connection available");
      return false;
    }

    try {
      console.log("💾 Starting data save...");
      const buffer = await TableOperations.serialize(this.connection);
      console.log("📦 Data buffer size:", buffer.byteLength, "bytes");
      await SettingsDB.save(buffer);
      console.log("✅ Data saved to IndexedDB successfully");
      return true;
    } catch (error) {
      console.error("💥 Failed to save database:", error);
      return false;
    }
  }

  public static async destroyDatabase() {
    console.log("🗑️ Destroying database...");
    this.cleanup();
    await SettingsDB.clear();
    console.log("✅ Database destroyed successfully");
  }
}

export const getDb = DuckDBManager.getConnection.bind(DuckDBManager);
export const saveDatabase = DuckDBManager.saveDatabase.bind(DuckDBManager);
export const destroyDatabase = DuckDBManager.destroyDatabase.bind(DuckDBManager);

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
