import { AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';

export interface Transaction {
  execute: (sql: string, params?: unknown[]) => Promise<void>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
}

export async function beginTransaction(conn: AsyncDuckDBConnection): Promise<Transaction> {
  await conn.query('BEGIN TRANSACTION');

  return {
    execute: async (sql: string, params?: unknown[]) => {
      const statement = await conn.prepare(sql);
      if (params && params.length > 0) {
        await statement.query(params);
      } else {
        await statement.query();
      }
      await statement.close();
    },
    commit: async () => {
      await conn.query('COMMIT');
    },
    rollback: async () => {
      await conn.query('ROLLBACK');
    }
  };
}

export class SettingsDB {
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
