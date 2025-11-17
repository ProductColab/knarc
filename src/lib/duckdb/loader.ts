import { KnackApplication } from "@/lib/knack/types/application";
import { DependencyGraph } from "@/lib/deps/graph";
import { buildRuleIndex, RuleDescriptor } from "@/lib/services/ruleIndex";
import { TABLES, FTS_TABLES } from "./schema";
import type { AsyncDuckDB, AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";

export interface LoadOptions {
  enableFTS?: boolean;
}

/**
 * Loads Knack application data into DuckDB tables
 */
export async function loadApplicationData(
  db: AsyncDuckDB,
  app: KnackApplication,
  graph: DependencyGraph,
  options: LoadOptions = {}
): Promise<void> {
  const conn = await db.connect();

  try {
    // Create all base tables
    for (const table of Object.values(TABLES)) {
      await conn.query(table.schema);
    }

    // Load objects
    await loadObjects(db, conn, app);

    // Load fields
    await loadFields(db, conn, app);

    // Load scenes
    await loadScenes(db, conn, app);

    // Load views
    await loadViews(db, conn, app);

    // Load rules (requires graph)
    const ruleIndex = buildRuleIndex(graph, app);
    await loadRules(db, conn, ruleIndex.allRules);

    // Load edges
    await loadEdges(db, conn, graph);

    // Create FTS indexes if enabled
    if (options.enableFTS) {
      await createFTSIndexes(conn);
    }
  } finally {
    await conn.close();
  }
}

async function loadObjects(
  db: AsyncDuckDB,
  conn: AsyncDuckDBConnection,
  app: KnackApplication
): Promise<void> {
  const rows = app.objects.map((obj) => ({
    key: obj.key,
    name: obj.name || null,
    type: obj.type || null,
    identifier: obj.identifier || null,
    schema_change_in_progress: obj.schemaChangeInProgress || false,
    sort_field: obj.sort?.field || null,
    sort_order: obj.sort?.order || null,
    field_count: obj.fields?.length || 0,
  }));

  if (rows.length === 0) return;

  // Use JSON insertion which is simpler and more reliable
  await db.registerFileText("objects.json", JSON.stringify(rows));
  await conn.insertJSONFromPath("objects.json", { name: "objects" });
}

async function loadFields(
  db: AsyncDuckDB,
  conn: AsyncDuckDBConnection,
  app: KnackApplication
): Promise<void> {
  const rows: Array<{
    key: string;
    name: string | null;
    type: string | null;
    description: string | null;
    required: boolean;
    unique: boolean;
    user: boolean;
    conditional: boolean;
    object_key: string;
    object_name: string | null;
  }> = [];

  for (const obj of app.objects) {
    for (const field of obj.fields || []) {
      rows.push({
        key: field.key,
        name: field.name || null,
        type: field.type || null,
        description: field.description || null,
        required: field.required || false,
        unique: field.unique || false,
        user: field.user || false,
        conditional: field.conditional || false,
        object_key: obj.key,
        object_name: obj.name || null,
      });
    }
  }

  if (rows.length === 0) return;

  await db.registerFileText("fields.json", JSON.stringify(rows));
  await conn.insertJSONFromPath("fields.json", { name: "fields" });
}

async function loadScenes(
  db: AsyncDuckDB,
  conn: AsyncDuckDBConnection,
  app: KnackApplication
): Promise<void> {
  const rows = app.scenes.map((scene) => ({
    key: scene.key,
    name: scene.name || null,
    slug: scene.slug || null,
    authenticated: scene.authenticated || false,
    object_key: scene.object || null,
    view_count: scene.views?.length || 0,
  }));

  if (rows.length === 0) return;

  await db.registerFileText("scenes.json", JSON.stringify(rows));
  await conn.insertJSONFromPath("scenes.json", { name: "scenes" });
}

async function loadViews(
  db: AsyncDuckDB,
  conn: AsyncDuckDBConnection,
  app: KnackApplication
): Promise<void> {
  const rows: Array<{
    key: string;
    name: string | null;
    type: string | null;
    title: string | null;
    scene_key: string;
    scene_name: string | null;
    object_key: string | null;
    object_name: string | null;
  }> = [];

  for (const scene of app.scenes) {
    for (const view of scene.views || []) {
      // Find the object this view references
      let objectKey: string | null = null;
      let objectName: string | null = null;
      if (view.source?.object) {
        const obj = app.objects.find((o) => o.key === view.source?.object);
        objectKey = obj?.key || null;
        objectName = obj?.name || null;
      }

      rows.push({
        key: view.key,
        name: view.name || null,
        type: view.type || null,
        title: view.title || null,
        scene_key: scene.key,
        scene_name: scene.name || null,
        object_key: objectKey,
        object_name: objectName,
      });
    }
  }

  if (rows.length === 0) return;

  await db.registerFileText("views.json", JSON.stringify(rows));
  await conn.insertJSONFromPath("views.json", { name: "views" });
}

async function loadRules(
  db: AsyncDuckDB,
  conn: AsyncDuckDBConnection,
  rules: RuleDescriptor[]
): Promise<void> {
  if (rules.length === 0) return;

  const rows = rules.map((rule) => ({
    id: rule.id,
    category: rule.category,
    source: rule.source,
    target_field_key: rule.targetField.key || "",
    target_field_name: rule.targetField.name || null,
    origin_type: rule.origin.type,
    origin_key: rule.origin.key || "",
    origin_name: rule.origin.name || null,
    location_path: rule.locationPath,
    view_name: rule.viewName || null,
    view_type: rule.viewType || null,
    scene_name: rule.sceneName || null,
    object_name: rule.objectName || null,
    task_name: rule.taskName || null,
    task_schedule: rule.taskSchedule ? JSON.stringify(rule.taskSchedule) : null,
    operator: rule.operator || null,
    rule_type: rule.ruleType || null,
    email_subject: rule.emailSubject || null,
    email_message: rule.emailMessage || null,
    email_from_name: rule.emailFromName || null,
    email_from_email: rule.emailFromEmail || null,
    email_recipients: rule.emailRecipients
      ? JSON.stringify(rule.emailRecipients)
      : null,
    record_values: rule.recordValues ? JSON.stringify(rule.recordValues) : null,
    record_criteria: rule.recordCriteria
      ? JSON.stringify(rule.recordCriteria)
      : null,
  }));

  await db.registerFileText("rules.json", JSON.stringify(rows));
  await conn.insertJSONFromPath("rules.json", { name: "rules" });
}

async function loadEdges(
  db: AsyncDuckDB,
  conn: AsyncDuckDBConnection,
  graph: DependencyGraph
): Promise<void> {
  const edges = graph.getAllEdges();
  if (edges.length === 0) return;

  const rows = edges.map((edge) => ({
    id: `${edge.from.type}:${edge.from.key}->${edge.to.type}:${edge.to.key}`,
    from_type: edge.from.type,
    from_key: edge.from.key || "",
    from_name: edge.from.name || null,
    to_type: edge.to.type,
    to_key: edge.to.key || "",
    to_name: edge.to.name || null,
    edge_type: edge.type,
    location_path: edge.locationPath || null,
    details: edge.details ? JSON.stringify(edge.details) : null,
  }));

  await db.registerFileText("edges.json", JSON.stringify(rows));
  await conn.insertJSONFromPath("edges.json", { name: "edges" });
}

async function createFTSIndexes(conn: AsyncDuckDBConnection): Promise<void> {
  // Create FTS table
  await conn.query(FTS_TABLES.rules_fts.schema);

  // Populate FTS index
  await conn.query(`
    INSERT INTO rules_fts(rowid, email_message, email_subject, target_field_name, origin_name, view_name, task_name)
    SELECT rowid, email_message, email_subject, target_field_name, origin_name, view_name, task_name
    FROM rules
  `);
}
