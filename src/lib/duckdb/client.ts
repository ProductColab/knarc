import type {
  AsyncDuckDB,
  AsyncDuckDBConnection,
} from "@duckdb/duckdb-wasm";
import type { QueryResult } from "./types";

/**
 * DuckDB client wrapper for querying Knack application data
 */
export class DuckDBClient {
  private db: AsyncDuckDB;
  private connection: AsyncDuckDBConnection | null = null;

  constructor(db: AsyncDuckDB) {
    this.db = db;
  }

  /**
   * Get or create a connection
   */
  private async getConnection(): Promise<AsyncDuckDBConnection> {
    if (!this.connection) {
      this.connection = await this.db.connect();
    }
    return this.connection;
  }

  /**
   * Execute a SQL query and return results as JSON
   */
  async query<T = Record<string, unknown>>(
    sql: string
  ): Promise<QueryResult<T>> {
    const conn = await this.getConnection();
    const result = await conn.query<T>(sql);

    // Convert Arrow table to JSON
    const rows = result.toArray().map((row) => row.toJSON() as T);
    const columns = result.schema.fields.map((f) => f.name);

    return {
      columns,
      rows,
      rowCount: rows.length,
    };
  }

  /**
   * Execute a query and return results as a stream
   */
  async *queryStream<T = Record<string, unknown>>(
    sql: string
  ): AsyncGenerator<T[], void, unknown> {
    const conn = await this.getConnection();
    for await (const batch of await conn.send<T>(sql)) {
      const rows = batch.toArray().map((row) => row.toJSON() as T);
      yield rows;
    }
  }

  /**
   * Close the connection
   */
  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }

  /**
   * Get the underlying DuckDB instance
   */
  getDB(): AsyncDuckDB {
    return this.db;
  }
}

