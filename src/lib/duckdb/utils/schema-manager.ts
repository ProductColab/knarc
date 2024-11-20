import { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";

export class SchemaManager {
  static async initializeSchema(conn: AsyncDuckDBConnection): Promise<void> {
    console.log("🔄 Initializing database schema...");

    try {
      // Create tables in order of dependencies
      await conn.query(`
        CREATE TABLE IF NOT EXISTS configs (
          id INTEGER PRIMARY KEY,
          config JSON NOT NULL
        )
      `);

      await conn.query(`
        CREATE SEQUENCE IF NOT EXISTS config_id_seq START WITH 1
      `);

      await conn.query(`
        ALTER TABLE configs ALTER COLUMN id SET DEFAULT nextval('config_id_seq')
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS objects (
          config_id INTEGER REFERENCES configs(id),
          key TEXT,
          object JSON NOT NULL,
          PRIMARY KEY (config_id, key)
        )
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS fields (
          config_id INTEGER,
          object_key TEXT,
          key TEXT,
          field JSON NOT NULL,
          PRIMARY KEY (config_id, object_key, key),
          FOREIGN KEY (config_id, object_key) REFERENCES objects(config_id, key)
        )
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS scenes (
          config_id INTEGER REFERENCES configs(id),
          key TEXT,
          scene JSON NOT NULL,
          PRIMARY KEY (config_id, key)
        )
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS views (
          config_id INTEGER,
          scene_key TEXT,
          key TEXT,
          view JSON NOT NULL,
          PRIMARY KEY (config_id, scene_key, key),
          FOREIGN KEY (config_id, scene_key) REFERENCES scenes(config_id, key)
        )
      `);

      console.log("✅ Schema initialization complete");
    } catch (error) {
      console.error("❌ Failed to initialize schema:", error);
      throw error;
    }
  }

  static async checkTablesExist(conn: AsyncDuckDBConnection): Promise<boolean> {
    try {
      const result = await conn.query(`
        SELECT COUNT(*) = 5 as all_exist
        FROM information_schema.tables
        WHERE table_name IN ('configs', 'objects', 'fields', 'scenes', 'views')
          AND table_schema = 'main'
      `);
      return result.get(0)?.all_exist === true;
    } catch (error) {
      console.error("❌ Failed to check tables:", error);
      return false;
    }
  }
} 