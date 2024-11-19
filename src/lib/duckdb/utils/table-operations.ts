import { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";

export class TableOperations {
  static async withTransaction<T>(
    conn: AsyncDuckDBConnection,
    operation: () => Promise<T>
  ): Promise<T> {
    try {
      await conn.query('BEGIN TRANSACTION');
      const result = await operation();
      await conn.query('COMMIT');
      return result;
    } catch (error) {
      await conn.query('ROLLBACK');
      throw error;
    }
  }

  static async serialize(conn: AsyncDuckDBConnection): Promise<Uint8Array> {
    return this.withTransaction(conn, async () => {
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
    });
  }

  static async restore(conn: AsyncDuckDBConnection, data: Uint8Array) {
    return this.withTransaction(conn, async () => {
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

        // Clear existing data before restore
        await conn.query('DELETE FROM settings');

        for (const row of rows) {
          if (!row.application_id || !row.settings) {
            console.error("❌ Invalid row format:", row);
            continue;
          }

          const query = `
            INSERT INTO settings (application_id, settings)
            VALUES (?, ?)
            ON CONFLICT (application_id) DO UPDATE 
            SET settings = EXCLUDED.settings;
          `;

          // Use parameterized query to prevent SQL injection
          const stmt = await conn.prepare(query);
          await stmt.query(row.application_id, row.settings);
          await stmt.close();
          console.log("🔄 Restored row for application:", row.application_id);
        }
      } catch (error) {
        console.error("❌ Error restoring table:", error);
        throw error;
      }
    });
  }

  static async clearAllData(conn: AsyncDuckDBConnection): Promise<void> {
    return this.withTransaction(conn, async () => {
      try {
        await conn.query('DELETE FROM settings');
        console.log("🧹 Cleared all data from settings table");
      } catch (error) {
        console.error("❌ Error clearing table:", error);
        throw error;
      }
    });
  }
}
