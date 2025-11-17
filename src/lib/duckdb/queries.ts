import type { DuckDBClient } from "./client";
import type { RuleCategory, RuleSource } from "@/lib/services/ruleIndex";

/**
 * Predefined queries for common rule operations
 */
export class RuleQueries {
  constructor(private client: DuckDBClient) {}

  /**
   * Get all rules with optional filters
   */
  async getRules(options: {
    category?: RuleCategory;
    source?: RuleSource;
    targetFieldKey?: string;
    originKey?: string;
    searchTerm?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Array<Record<string, unknown>>> {
    let sql = "SELECT * FROM rules WHERE 1=1";

    if (options.category) {
      sql += ` AND category = '${options.category}'`;
    }

    if (options.source) {
      sql += ` AND source = '${options.source}'`;
    }

    if (options.targetFieldKey) {
      sql += ` AND target_field_key = '${options.targetFieldKey}'`;
    }

    if (options.originKey) {
      sql += ` AND origin_key = '${options.originKey}'`;
    }

    if (options.searchTerm) {
      const term = options.searchTerm.replace(/'/g, "''");
      sql += ` AND (
        email_message LIKE '%${term}%' OR
        email_subject LIKE '%${term}%' OR
        target_field_name LIKE '%${term}%' OR
        origin_name LIKE '%${term}%' OR
        view_name LIKE '%${term}%' OR
        task_name LIKE '%${term}%'
      )`;
    }

    sql += " ORDER BY target_field_name, origin_name";

    if (options.limit) {
      sql += ` LIMIT ${options.limit}`;
      if (options.offset) {
        sql += ` OFFSET ${options.offset}`;
      }
    }

    const result = await this.client.query(sql);
    return result.rows;
  }

  /**
   * Full-text search using FTS index
   */
  async searchRules(
    searchTerm: string,
    options: {
      category?: RuleCategory;
      source?: RuleSource;
      limit?: number;
    } = {}
  ): Promise<Array<Record<string, unknown>>> {
    const term = searchTerm.replace(/'/g, "''");
    let sql = `
      SELECT r.*, 
             bm25(rules_fts) AS rank
      FROM rules r
      JOIN rules_fts ON r.rowid = rules_fts.rowid
      WHERE rules_fts MATCH '${term}'
    `;

    if (options.category) {
      sql += ` AND r.category = '${options.category}'`;
    }

    if (options.source) {
      sql += ` AND r.source = '${options.source}'`;
    }

    sql += " ORDER BY rank DESC";

    if (options.limit) {
      sql += ` LIMIT ${options.limit}`;
    }

    const result = await this.client.query(sql);
    return result.rows;
  }

  /**
   * Get rules grouped by category
   */
  async getRulesByCategory(): Promise<
    Array<{ category: string; count: number }>
  > {
    const result = await this.client.query<{ category: string; count: number }>(
      `SELECT category, COUNT(*) as count FROM rules GROUP BY category ORDER BY count DESC`
    );
    return result.rows;
  }

  /**
   * Get rules grouped by source
   */
  async getRulesBySource(): Promise<
    Array<{ source: string; count: number }>
  > {
    const result = await this.client.query<{ source: string; count: number }>(
      `SELECT source, COUNT(*) as count FROM rules GROUP BY source ORDER BY count DESC`
    );
    return result.rows;
  }

  /**
   * Get rules for a specific field
   */
  async getRulesForField(fieldKey: string): Promise<
    Array<Record<string, unknown>>
  > {
    const result = await this.client.query(
      `SELECT * FROM rules WHERE target_field_key = '${fieldKey.replace(/'/g, "''")}' ORDER BY category, source`
    );
    return result.rows;
  }

  /**
   * Get rules from a specific origin
   */
  async getRulesFromOrigin(originKey: string): Promise<
    Array<Record<string, unknown>>
  > {
    const result = await this.client.query(
      `SELECT * FROM rules WHERE origin_key = '${originKey.replace(/'/g, "''")}' ORDER BY category, target_field_name`
    );
    return result.rows;
  }

  /**
   * Get email rules with missing subjects
   */
  async getEmailRulesWithoutSubject(): Promise<
    Array<Record<string, unknown>>
  > {
    const result = await this.client.query(
      `SELECT * FROM rules WHERE category = 'email' AND (email_subject IS NULL OR email_subject = '')`
    );
    return result.rows;
  }

  /**
   * Get rules statistics
   */
  async getRuleStats(): Promise<{
    total: number;
    byCategory: Array<{ category: string; count: number }>;
    bySource: Array<{ source: string; count: number }>;
    emailRulesWithoutSubject: number;
  }> {
    const [totalResult, byCategory, bySource, emailWithoutSubject] =
      await Promise.all([
        this.client.query<{ count: number }>(
          "SELECT COUNT(*) as count FROM rules"
        ),
        this.getRulesByCategory(),
        this.getRulesBySource(),
        this.client.query<{ count: number }>(
          "SELECT COUNT(*) as count FROM rules WHERE category = 'email' AND (email_subject IS NULL OR email_subject = '')"
        ),
      ]);

    return {
      total: totalResult.rows[0]?.count || 0,
      byCategory,
      bySource,
      emailRulesWithoutSubject: emailWithoutSubject.rows[0]?.count || 0,
    };
  }
}

/**
 * Export rules to CSV format
 */
export async function exportRulesToCSV(
  client: DuckDBClient,
  options: {
    category?: RuleCategory;
    source?: RuleSource;
    searchTerm?: string;
  } = {}
): Promise<string> {
  let sql = "SELECT * FROM rules WHERE 1=1";

  if (options.category) {
    sql += ` AND category = '${options.category}'`;
  }

  if (options.source) {
    sql += ` AND source = '${options.source}'`;
  }

  if (options.searchTerm) {
    const term = options.searchTerm.replace(/'/g, "''");
    sql += ` AND (
      email_message LIKE '%${term}%' OR
      email_subject LIKE '%${term}%' OR
      target_field_name LIKE '%${term}%' OR
      origin_name LIKE '%${term}%'
    )`;
  }

  sql += " ORDER BY category, source, target_field_name";

  // Use DuckDB's CSV export
  const db = client.getDB();
  const conn = await db.connect();
  try {
    await conn.query(`
      COPY (${sql}) TO 'rules-export.csv' (FORMAT CSV, HEADER)
    `);
    const csvBuffer = await db.copyFileToBuffer("rules-export.csv");
    return new TextDecoder().decode(csvBuffer);
  } finally {
    await conn.close();
  }
}

