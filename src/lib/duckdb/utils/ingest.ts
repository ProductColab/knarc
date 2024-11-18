import { getDb } from "../index";

interface InsertOptions {
  // Table to insert into
  table: string;
  // Optional schema name, defaults to 'main'
  schema?: string;
  // Whether to replace existing table, defaults to false
  replace?: boolean;
}

/**
 * Inserts JSON data from an API response into a DuckDB table
 */
export async function insertJsonData<T extends object>(
  data: T | T[],
  options: InsertOptions
) {
  const { db, conn } = await getDb();
  const jsonData = Array.isArray(data) ? data : [data];

  if (jsonData.length === 0) {
    return;
  }

  const {
    table,
    schema = 'main',
    replace = false
  } = options;

  // Register JSON data and insert it
  await db.registerFileText(
    `${table}.json`,
    JSON.stringify(jsonData)
  );

  if (replace) {
    await conn.query(`DROP TABLE IF EXISTS ${schema}.${table}`);
  }

  await conn.insertJSONFromPath(`${table}.json`, {
    name: table,
    schema: schema
  });
}

/**
 * Creates a table from JSON data, inferring the schema
 */
export async function createTableFromJson<T extends object>(
  data: T | T[],
  options: InsertOptions
) {
  return insertJsonData(data, { ...options, replace: true });
}