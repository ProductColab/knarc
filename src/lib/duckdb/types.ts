export interface DuckDBTable {
  name: string;
  schema: string; // SQL CREATE TABLE statement
}

export interface DuckDBConfig {
  enableFTS?: boolean;
  enableExtensions?: string[];
}

export interface QueryResult<T = unknown> {
  columns: string[];
  rows: T[];
  rowCount: number;
}
