import { Config, ConfigId, ConfigUpdate } from "./types";
import { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";

export const fetchConfig = async (conn: AsyncDuckDBConnection, id: ConfigId): Promise<Config | null> => {
  const stmt = await conn.prepare(`
      SELECT id, settings
      FROM settings
      WHERE id = ?
    `);
  const result = await stmt.query(id);
  await stmt.close();

  const rows = result.toArray();
  if (rows.length === 0) return null;

  const settings = JSON.parse(rows[0].settings);
  return {
    id: rows[0].id,
    config: settings.config
  };
};

export const fetchAvailableConfigs = async (conn: AsyncDuckDBConnection): Promise<Array<{ id: number, applicationId: string }>> => {
  const result = await conn.query(`
    SELECT id, application_id 
    FROM settings 
    ORDER BY id
  `);
  return result.toArray().map((row) => ({
    id: row.id,
    applicationId: row.application_id
  }));
};

export const updateConfig = async (
  conn: AsyncDuckDBConnection,
  data: ConfigUpdate
): Promise<number> => {
  if (data.id) {
    const stmt = await conn.prepare(`
      UPDATE settings 
      SET application_id = ?, settings = ?
      WHERE id = ?
      RETURNING id
    `);

    const result = await stmt.query(
      data.config.applicationId,
      JSON.stringify({ config: data.config }),
      data.id
    );
    await stmt.close();
    return result.toArray()[0].id;
  } else {
    const stmt = await conn.prepare(`
      INSERT INTO settings (application_id, settings)
      VALUES (?, ?)
      RETURNING id
    `);

    const result = await stmt.query(
      data.config.applicationId,
      JSON.stringify({ config: data.config })
    );
    await stmt.close();
    return result.toArray()[0].id;
  }
};
