import { Settings, SettingsApplicationId, SettingsUpdate } from "./types";
import { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";

export const fetchSettings = async (conn: AsyncDuckDBConnection, applicationId: SettingsApplicationId): Promise<Settings | null> => {
  const stmt = await conn.prepare(`
      SELECT settings
      FROM settings
      WHERE application_id = ?
    `);
  const result = await stmt.query(applicationId);
  await stmt.close();

  const rows = result.toArray();
  return rows.length > 0 ? JSON.parse(rows[0].settings) : null;
};

export const fetchAvailableSettings = async (conn: AsyncDuckDBConnection): Promise<SettingsApplicationId[]> => {
  const result = await conn.query(`
    SELECT application_id 
    FROM settings 
    ORDER BY application_id
    `);
  return result.toArray().map((row) => row.application_id as string);
};

export const updateSettings = async (
  conn: AsyncDuckDBConnection,
  data: SettingsUpdate
): Promise<void> => {
  const stmt = await conn.prepare(`
    INSERT INTO settings (application_id, settings)
      VALUES (?, ?)
      ON CONFLICT (application_id) 
      DO UPDATE SET settings = EXCLUDED.settings
    `);

  const settings: Settings = {
    id: data.id,
    config: data.config
  };

  await stmt.query(data.id, JSON.stringify(settings));
  await stmt.close();
};
