import { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { KnackScene } from "@/lib/knack/types/scene";

export async function initializeSchemaTable(conn: AsyncDuckDBConnection) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS scenes (
      config_id INTEGER,
      key TEXT,
      scene JSON NOT NULL,
      PRIMARY KEY (config_id, key),
      FOREIGN KEY (config_id) REFERENCES configs(id)
    )
  `);
}

async function executeStatement(
  conn: AsyncDuckDBConnection,
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[]
) {
  const stmt = await conn.prepare(sql);
  const result = await stmt.query(...params);
  await stmt.close();
  return result;
}

export async function upsertScenes(
  conn: AsyncDuckDBConnection,
  configId: number,
  scenes: KnackScene[]
) {
  console.log(`📝 Upserting scenes for config:`, configId);

  // Delete existing scenes
  await executeStatement(
    conn,
    `DELETE FROM scenes WHERE config_id = ?`,
    [configId]
  );

  // Insert new scenes
  for (const scene of scenes) {
    const sceneJson = JSON.stringify(scene);
    await executeStatement(
      conn,
      `INSERT INTO scenes (config_id, key, scene) VALUES (?, ?, CAST(? AS JSON))`,
      [configId, scene.key, sceneJson]
    );
  }
}

export async function getScenes(
  conn: AsyncDuckDBConnection,
  configId: number
): Promise<KnackScene[]> {
  const result = await executeStatement(
    conn,
    `SELECT scene FROM scenes WHERE config_id = ?`,
    [configId]
  );

  return result.toArray().map(row => {
    const value = row.scene;
    return typeof value === 'string' ? JSON.parse(value) : value;
  });
}

export async function getSceneByKey(
  conn: AsyncDuckDBConnection,
  configId: number,
  key: string
): Promise<KnackScene | null> {
  const result = await executeStatement(
    conn,
    `SELECT scene FROM scenes WHERE config_id = ? AND key = ?`,
    [configId, key]
  );

  if (result.numRows === 0) return null;

  const row = result.get(0);
  if (!row) return null;

  const value = row.scene;
  return typeof value === 'string' ? JSON.parse(value) : value;
}
