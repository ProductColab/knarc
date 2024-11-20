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
  private static KEY_NAME = 'dbBuffer';

  static async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error("📛 Failed to open IndexedDB:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log("🔓 IndexedDB opened successfully");
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        console.log("🔄 Upgrading IndexedDB schema...");
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
          console.log("📦 Created new object store:", this.STORE_NAME);
        }
      };
    });
  }

  private static async withDatabase<T>(operation: (db: IDBDatabase) => Promise<T>): Promise<T> {
    let db: IDBDatabase | null = null;
    try {
      db = await this.openDB();
      return await operation(db);
    } finally {
      if (db) db.close();
    }
  }

  static async save(buffer: Uint8Array): Promise<void> {
    return this.withDatabase(async (db) => {
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);

        transaction.oncomplete = () => {
          console.log("💾 Data saved to IndexedDB successfully");
          resolve();
        };

        transaction.onerror = () => {
          console.error("❌ Failed to save to IndexedDB:", transaction.error);
          reject(transaction.error);
        };

        store.put(buffer, this.KEY_NAME);
      });
    });
  }

  static async load(): Promise<Uint8Array | null> {
    return this.withDatabase(async (db) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.get(this.KEY_NAME);

        transaction.oncomplete = () => {
          console.log("📖 Data loaded from IndexedDB successfully");
        };

        request.onerror = () => {
          console.error("❌ Failed to load from IndexedDB:", request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          const data = request.result;
          if (data) {
            console.log("📊 Found data in IndexedDB");
          } else {
            console.log("📭 No data found in IndexedDB");
          }
          resolve(data || null);
        };
      });
    });
  }

  static async clear(): Promise<void> {
    return this.withDatabase(async (db) => {
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);

        transaction.oncomplete = () => {
          console.log("🧹 IndexedDB cleared successfully");
          resolve();
        };

        transaction.onerror = () => {
          console.error("❌ Failed to clear IndexedDB:", transaction.error);
          reject(transaction.error);
        };

        store.clear();
      });
    });
  }
}
