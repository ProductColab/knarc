/**
 * DuckDB table schemas for Knack application data
 */

export const TABLES = {
  objects: {
    name: "objects",
    schema: `
      CREATE TABLE objects (
        key TEXT PRIMARY KEY,
        name TEXT,
        type TEXT,
        identifier TEXT,
        schema_change_in_progress BOOLEAN,
        sort_field TEXT,
        sort_order TEXT,
        field_count INTEGER
      )
    `,
  },
  fields: {
    name: "fields",
    schema: `
      CREATE TABLE fields (
        key TEXT PRIMARY KEY,
        name TEXT,
        type TEXT,
        description TEXT,
        required BOOLEAN,
        unique BOOLEAN,
        user BOOLEAN,
        conditional BOOLEAN,
        object_key TEXT,
        object_name TEXT
      )
    `,
  },
  views: {
    name: "views",
    schema: `
      CREATE TABLE views (
        key TEXT PRIMARY KEY,
        name TEXT,
        type TEXT,
        title TEXT,
        scene_key TEXT,
        scene_name TEXT,
        object_key TEXT,
        object_name TEXT
      )
    `,
  },
  scenes: {
    name: "scenes",
    schema: `
      CREATE TABLE scenes (
        key TEXT PRIMARY KEY,
        name TEXT,
        slug TEXT,
        authenticated BOOLEAN,
        object_key TEXT,
        view_count INTEGER
      )
    `,
  },
  rules: {
    name: "rules",
    schema: `
      CREATE TABLE rules (
        id TEXT PRIMARY KEY,
        category TEXT,
        source TEXT,
        target_field_key TEXT,
        target_field_name TEXT,
        origin_type TEXT,
        origin_key TEXT,
        origin_name TEXT,
        location_path TEXT,
        view_name TEXT,
        view_type TEXT,
        scene_name TEXT,
        object_name TEXT,
        task_name TEXT,
        task_schedule TEXT,
        operator TEXT,
        rule_type TEXT,
        email_subject TEXT,
        email_message TEXT,
        email_from_name TEXT,
        email_from_email TEXT,
        email_recipients TEXT,
        record_values TEXT,
        record_criteria TEXT
      )
    `,
  },
  edges: {
    name: "edges",
    schema: `
      CREATE TABLE edges (
        id TEXT PRIMARY KEY,
        from_type TEXT,
        from_key TEXT,
        from_name TEXT,
        to_type TEXT,
        to_key TEXT,
        to_name TEXT,
        edge_type TEXT,
        location_path TEXT,
        details TEXT
      )
    `,
  },
} as const;

export const FTS_TABLES = {
  rules_fts: {
    name: "rules_fts",
    schema: `
      CREATE VIRTUAL TABLE rules_fts USING fts5(
        id UNINDEXED,
        email_message,
        email_subject,
        target_field_name,
        origin_name,
        view_name,
        task_name,
        content='rules',
        content_rowid='rowid'
      )
    `,
  },
} as const;
