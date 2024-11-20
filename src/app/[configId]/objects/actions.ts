import { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { KnackObject } from "@/lib/knack/types/object";
import { KnackScene } from "@/lib/knack/types/scene";
import { KnackField } from "@/lib/knack/types/field";
import { KnackView } from "@/lib/knack/types/view";

export async function initializeSchemaTable(conn: AsyncDuckDBConnection) {
  // Create objects table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS objects (
      config_id INTEGER,
      key TEXT,
      object JSON NOT NULL,
      PRIMARY KEY (config_id, key),
      FOREIGN KEY (config_id) REFERENCES configs(id)
    )
  `);

  // Create fields table
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

  // Create scenes table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS scenes (
      config_id INTEGER,
      key TEXT,
      scene JSON NOT NULL,
      PRIMARY KEY (config_id, key),
      FOREIGN KEY (config_id) REFERENCES configs(id)
    )
  `);

  // Create views table
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

export async function upsertObjects(
  conn: AsyncDuckDBConnection,
  configId: number,
  objects: KnackObject[]
) {
  console.log(`📝 Upserting objects and fields for config:`, configId);
  console.log(`📊 Total objects:`, objects.length);

  try {
    // First, delete existing objects and their fields
    await executeStatement(
      conn,
      `DELETE FROM fields WHERE config_id = ?`,
      [configId]
    );
    console.log("✅ Existing fields deleted");

    // Insert objects and their fields
    let totalFields = 0;
    for (const object of objects) {
      const { fields, ...objectWithoutFields } = object;

      // Insert object first
      await executeStatement(
        conn,
        `INSERT INTO objects (config_id, key, object) VALUES (?, ?, CAST(? AS JSON))`,
        [configId, object.key, JSON.stringify(objectWithoutFields)]
      );

      // Then insert all fields for this object
      for (const field of fields) {
        await executeStatement(
          conn,
          `INSERT INTO fields (config_id, object_key, key, field) VALUES (?, ?, ?, CAST(? AS JSON))`,
          [configId, object.key, field.key, JSON.stringify(field)]
        );
        totalFields++;
      }
    }

    console.log(`✅ Inserted ${objects.length} objects and ${totalFields} fields`);
  } catch (error) {
    console.error("❌ Error upserting objects:", error);
    throw error;
  }
}

export async function upsertScenes(
  conn: AsyncDuckDBConnection,
  configId: number,
  scenes: KnackScene[]
) {
  console.log(`📝 Upserting scenes and views for config:`, configId);

  // First, delete existing scenes and their views
  await executeStatement(
    conn,
    `DELETE FROM views WHERE config_id = ?`,
    [configId]
  );
  await executeStatement(
    conn,
    `DELETE FROM scenes WHERE config_id = ?`,
    [configId]
  );

  // Insert scenes and their views
  for (const scene of scenes) {
    const { views, ...sceneWithoutViews } = scene;
    const sceneJson = JSON.stringify(sceneWithoutViews);

    // Insert scene
    await executeStatement(
      conn,
      `INSERT INTO scenes (config_id, key, scene) VALUES (?, ?, CAST(? AS JSON))`,
      [configId, scene.key, sceneJson]
    );

    // Insert views
    for (const view of views) {
      const viewJson = JSON.stringify(view);
      await executeStatement(
        conn,
        `INSERT INTO views (config_id, scene_key, key, view) VALUES (?, ?, ?, CAST(? AS JSON))`,
        [configId, scene.key, view.key, viewJson]
      );
    }
  }
}

async function getItems<T>(
  conn: AsyncDuckDBConnection,
  configId: number,
  tableName: string,
  jsonField: string
): Promise<T[]> {
  const result = await executeStatement(
    conn,
    `SELECT ${jsonField} FROM ${tableName} WHERE config_id = ?`,
    [configId]
  );

  return result.toArray().map(row => {
    const value = row[jsonField];
    return typeof value === 'string' ? JSON.parse(value) : value;
  });
}

export async function getObjects(
  conn: AsyncDuckDBConnection,
  configId: number
): Promise<KnackObject[]> {
  return getItems<KnackObject>(conn, configId, 'objects', 'object');
}

export async function getScenes(
  conn: AsyncDuckDBConnection,
  configId: number
): Promise<KnackScene[]> {
  return getItems<KnackScene>(conn, configId, 'scenes', 'scene');
}

async function getItemByKey<T>(
  conn: AsyncDuckDBConnection,
  configId: number,
  key: string,
  tableName: string,
  jsonField: string
): Promise<T | null> {
  const result = await executeStatement(
    conn,
    `SELECT ${jsonField} FROM ${tableName} WHERE config_id = ? AND key = ?`,
    [configId, key]
  );

  if (result.numRows === 0) return null;

  const row = result.get(0);
  if (!row) return null;

  const value = row[jsonField];
  return typeof value === 'string' ? JSON.parse(value) : value;
}

export async function getObjectByKey(
  conn: AsyncDuckDBConnection,
  configId: number,
  key: string
): Promise<KnackObject | null> {
  return getItemByKey<KnackObject>(conn, configId, key, 'objects', 'object');
}

export async function getSceneByKey(
  conn: AsyncDuckDBConnection,
  configId: number,
  key: string
): Promise<KnackScene | null> {
  return getItemByKey<KnackScene>(conn, configId, key, 'scenes', 'scene');
}

// Fetch functions for fields
export async function getObjectFields(
  conn: AsyncDuckDBConnection,
  configId: number,
  objectKey: string
): Promise<KnackField[]> {
  const result = await executeStatement(
    conn,
    `SELECT field FROM fields WHERE config_id = ? AND object_key = ?`,
    [configId, objectKey]
  );

  return result.toArray().map(row => {
    const value = row.field;
    return typeof value === 'string' ? JSON.parse(value) : value;
  });
}

export async function getFieldByKey(
  conn: AsyncDuckDBConnection,
  configId: number,
  objectKey: string,
  fieldKey: string
): Promise<KnackField | null> {
  const result = await executeStatement(
    conn,
    `SELECT field FROM fields WHERE config_id = ? AND object_key = ? AND key = ?`,
    [configId, objectKey, fieldKey]
  );

  if (result.numRows === 0) return null;

  const row = result.get(0);
  if (!row) return null;

  const value = row.field;
  return typeof value === 'string' ? JSON.parse(value) : value;
}

// Fetch functions for views
export async function getSceneViews(
  conn: AsyncDuckDBConnection,
  configId: number,
  sceneKey: string
): Promise<KnackView[]> {
  const result = await executeStatement(
    conn,
    `SELECT view FROM views WHERE config_id = ? AND scene_key = ?`,
    [configId, sceneKey]
  );

  return result.toArray().map(row => {
    const value = row.view;
    return typeof value === 'string' ? JSON.parse(value) : value;
  });
}

export async function getViewByKey(
  conn: AsyncDuckDBConnection,
  configId: number,
  sceneKey: string,
  viewKey: string
): Promise<KnackView | null> {
  const result = await executeStatement(
    conn,
    `SELECT view FROM views WHERE config_id = ? AND scene_key = ? AND key = ?`,
    [configId, sceneKey, viewKey]
  );

  if (result.numRows === 0) return null;

  const row = result.get(0);
  if (!row) return null;

  const value = row.view;
  return typeof value === 'string' ? JSON.parse(value) : value;
}

// Advanced queries
export async function getAllFieldsByType(
  conn: AsyncDuckDBConnection,
  configId: number,
  fieldType: string
): Promise<Array<{ objectKey: string; field: KnackField }>> {
  const result = await executeStatement(
    conn,
    `
    SELECT 
      object_key,
      field
    FROM fields 
    WHERE config_id = ? 
    AND JSON_EXTRACT_STRING(field, '$.type') = ?
    `,
    [configId, fieldType]
  );

  return result.toArray().map(row => ({
    objectKey: row.object_key,
    field: typeof row.field === 'string' ? JSON.parse(row.field) : row.field
  }));
}

export async function getAllViewsByType(
  conn: AsyncDuckDBConnection,
  configId: number,
  viewType: string
): Promise<Array<{ sceneKey: string; view: KnackView }>> {
  const result = await executeStatement(
    conn,
    `
    SELECT 
      scene_key,
      view
    FROM views 
    WHERE config_id = ? 
    AND JSON_EXTRACT_STRING(view, '$.type') = ?
    `,
    [configId, viewType]
  );

  return result.toArray().map(row => ({
    sceneKey: row.scene_key,
    view: typeof row.view === 'string' ? JSON.parse(row.view) : row.view
  }));
}
