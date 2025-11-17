# DuckDB Integration

This module provides DuckDB-Wasm integration for querying and analyzing Knack application schema data.

## Overview

DuckDB is used to:
- Store application schema data (objects, fields, views, scenes, rules, edges) in relational tables
- Enable fast SQL queries for filtering, searching, and aggregating rules
- Provide full-text search (FTS) capabilities for email templates and rule content
- Export data to CSV/Parquet formats
- Support advanced analytics and reporting

## Usage

### Basic Setup

```typescript
import { useDuckDB } from "@/lib/hooks/use-duckdb";

function MyComponent() {
  const { client, loaded, loading, error } = useDuckDB(app, graph, {
    enableFTS: true, // Enable full-text search
  });

  if (loading) return <div>Loading DuckDB...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!loaded) return <div>Not ready</div>;

  // Use client for queries...
}
```

### Querying Rules

```typescript
import { RuleQueries } from "@/lib/duckdb/queries";

const queries = new RuleQueries(client);

// Get all email rules
const emailRules = await queries.getRules({ category: "email" });

// Search using FTS
const results = await queries.searchRules("student portal", {
  category: "email",
  limit: 10,
});

// Get rules for a specific field
const fieldRules = await queries.getRulesForField("field_123");

// Get statistics
const stats = await queries.getRuleStats();
```

### Custom SQL Queries

For advanced users, you can execute custom SQL queries:

```typescript
// Get the underlying client
const result = await client.query(`
  SELECT 
    category,
    COUNT(*) as count,
    COUNT(DISTINCT target_field_key) as unique_fields
  FROM rules
  GROUP BY category
  ORDER BY count DESC
`);

console.log(result.rows);
```

### Exporting Data

```typescript
import { exportRulesToCSV } from "@/lib/duckdb/queries";

const csv = await exportRulesToCSV(client, {
  category: "email",
  source: "form",
});

// csv is a string ready to download
```

## Database Schema

### Tables

- **objects**: Application objects (tables)
- **fields**: Fields within objects
- **views**: Views (forms, tables, etc.)
- **scenes**: Scenes containing views
- **rules**: All rules (email, record, display)
- **edges**: Dependency graph edges

### Full-Text Search

When `enableFTS: true`, a virtual FTS5 table `rules_fts` is created that indexes:
- `email_message`: Email template content
- `email_subject`: Email subject lines
- `target_field_name`: Field names
- `origin_name`: Origin entity names
- `view_name`: View names
- `task_name`: Task names

## Advanced SQL Examples

### Find all email rules without subjects

```sql
SELECT * FROM rules 
WHERE category = 'email' 
  AND (email_subject IS NULL OR email_subject = '')
```

### Count rules by object

```sql
SELECT 
  object_name,
  category,
  COUNT(*) as rule_count
FROM rules
WHERE object_name IS NOT NULL
GROUP BY object_name, category
ORDER BY rule_count DESC
```

### Find fields with the most rules

```sql
SELECT 
  target_field_name,
  target_field_key,
  COUNT(*) as rule_count,
  COUNT(DISTINCT category) as category_count
FROM rules
GROUP BY target_field_name, target_field_key
ORDER BY rule_count DESC
LIMIT 20
```

### Full-text search example

```sql
SELECT r.*, bm25(rules_fts) AS rank
FROM rules r
JOIN rules_fts ON r.rowid = rules_fts.rowid
WHERE rules_fts MATCH 'student portal'
ORDER BY rank DESC
```

## Performance Notes

- DuckDB loads data on initialization - this may take a few seconds for large schemas
- FTS indexes are created after initial data load
- Queries are executed in-memory (browser) - no network calls
- For very large datasets, consider pagination using LIMIT/OFFSET

## Future Enhancements

- Parquet export for snapshotting
- Schema diffing between versions
- Scheduled analytics queries
- Custom query builder UI
- Integration with complexity metrics

