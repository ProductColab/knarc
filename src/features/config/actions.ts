import { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { Config, ConfigUpdate, KnackConfig, ApplicationMetadata, ApplicationInfo } from "./types";

// Helper to extract metadata from full application info
function extractMetadata(applicationInfo?: ApplicationInfo): ApplicationMetadata | undefined {
  if (!applicationInfo) return undefined;

  return {
    name: applicationInfo.name,
    slug: applicationInfo.slug,
    logoUrl: applicationInfo.logoUrl,
    account: {
      slug: applicationInfo.account.slug,
      name: applicationInfo.account.name,
    }
  };
}

export async function fetchConfig(
  conn: AsyncDuckDBConnection,
  id: number
): Promise<Config | null> {
  const stmt = await conn.prepare(`
    SELECT id, config 
    FROM configs 
    WHERE id = ?
  `);

  const result = await stmt.query(id);
  await stmt.close();

  if (result.numRows === 0) return null;

  const row = result.get(0);
  if (!row) return null;

  const rawConfig = typeof row.config === 'string'
    ? JSON.parse(row.config)
    : row.config;

  return {
    id: row.id as number,
    config: rawConfig.config as KnackConfig,
    applicationInfo: rawConfig.applicationInfo
  };
}

export async function updateConfig(
  conn: AsyncDuckDBConnection,
  configUpdate: ConfigUpdate
): Promise<number> {
  console.log("📝 Starting updateConfig with data:", configUpdate);

  try {
    // Extract only the metadata for storage
    const metadata = extractMetadata(configUpdate.applicationInfo as ApplicationInfo);

    const configJson = JSON.stringify({
      config: configUpdate.config,
      applicationInfo: metadata // Store only metadata
    });

    if (!configUpdate.id) {
      console.log("➕ Creating new config");
      const stmt = await conn.prepare(
        `INSERT INTO configs (config) VALUES (CAST(? AS JSON)) RETURNING id`
      );

      const result = await stmt.query(configJson);
      await stmt.close();

      const row = result.get(0);
      if (!row) throw new Error("Failed to get new config ID");

      const newId = row.id as number;
      console.log("✅ Created new config with ID:", newId);
      return newId;
    } else {
      console.log("📝 Updating existing config:", configUpdate.id);
      const stmt = await conn.prepare(
        `UPDATE configs SET config = CAST(? AS JSON) WHERE id = ?`
      );

      await stmt.query(configJson, configUpdate.id);
      await stmt.close();
      return configUpdate.id;
    }
  } catch (error) {
    console.error("❌ Error in updateConfig:", error);
    throw error;
  }
}

export async function fetchAvailableConfigs(conn: AsyncDuckDBConnection): Promise<Config[]> {
  console.log("🎯 fetchAvailableConfigs: Starting fetch");
  const stmt = await conn.prepare(`SELECT id, config FROM configs`);
  const result = await stmt.query();
  await stmt.close();

  const rawArray = result.toArray();
  console.log("🎯 fetchAvailableConfigs: Raw DB result:", rawArray);

  const configs = rawArray.map(row => {
    console.log("🎯 fetchAvailableConfigs: Processing row:", row);

    try {
      const rawConfig = typeof row.config === 'string'
        ? JSON.parse(row.config)
        : row.config;

      const config: Config = {
        id: row.id as number,
        config: rawConfig.config as KnackConfig,
        applicationInfo: rawConfig.applicationInfo
      };

      console.log("🎯 fetchAvailableConfigs: Processed config:", config);
      return config;

    } catch (error) {
      console.error("🎯 fetchAvailableConfigs: Error processing row:", {
        error,
        row
      });
      throw error;
    }
  });

  console.log("🎯 fetchAvailableConfigs: Final configs:", configs);
  return configs;
}
