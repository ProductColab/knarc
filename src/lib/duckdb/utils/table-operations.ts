import { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";

interface KnackConfig {
  applicationId?: string;
  apiKey?: string;
  restApiKey?: string;
  [key: string]: unknown;
}

interface ConfigRow {
  id: number;
  config: KnackConfig;
}

export class TableOperations {
  private static async serializeToBuffer(rows: ConfigRow[]): Promise<Uint8Array> {
    const jsonStr = JSON.stringify(rows);
    const encoder = new TextEncoder();
    return encoder.encode(jsonStr);
  }

  private static async deserializeFromBuffer(buffer: Uint8Array): Promise<ConfigRow[]> {
    const decoder = new TextDecoder();
    const jsonStr = decoder.decode(buffer);
    return JSON.parse(jsonStr) as ConfigRow[];
  }

  private static async getConfigRows(conn: AsyncDuckDBConnection): Promise<ConfigRow[]> {
    const result = await conn.query(`
      SELECT id, config::JSON as config
      FROM configs
    `);

    return result.toArray().map(row => ({
      id: row.id,
      config: typeof row.config === 'string' ? JSON.parse(row.config) : row.config
    }));
  }

  static async serialize(conn: AsyncDuckDBConnection): Promise<Uint8Array> {
    try {
      const rows = await this.getConfigRows(conn);
      const buffer = await this.serializeToBuffer(rows);

      console.log("📝 Serialized data:", rows);
      console.log("📝 Serialized data size:", buffer.byteLength, "bytes");

      return buffer;
    } catch (error) {
      console.error("❌ Error serializing table:", error);
      throw error;
    }
  }

  static async restore(conn: AsyncDuckDBConnection, data: Uint8Array) {
    try {
      const rows = await this.deserializeFromBuffer(data);
      console.log("📊 Loaded rows:", rows.length);
      if (rows.length > 0) {
        console.log("📊 Sample row:", rows[0]);
      }

      // Insert data
      for (const row of rows) {
        const configStr = JSON.stringify(row.config).replace(/'/g, "''");
        await conn.query(`
          INSERT INTO configs (id, config)
          VALUES (${row.id}, CAST('${configStr}' AS JSON))
        `);
      }

      console.log("✅ Data restored successfully");
    } catch (error) {
      console.error("❌ Error restoring table:", error);
      throw error;
    }
  }

  static async insertConfig(conn: AsyncDuckDBConnection, config: KnackConfig): Promise<number> {
    try {
      const configStr = JSON.stringify(config).replace(/'/g, "''");
      const result = await conn.query(`
        INSERT INTO configs (config)
        VALUES (CAST('${configStr}' AS JSON))
        RETURNING id
      `);

      const newId = result.toArray()[0].id;
      console.log("✨ Created new config with ID:", newId);
      return newId;
    } catch (error) {
      console.error("❌ Error inserting config:", error);
      throw error;
    }
  }
}
