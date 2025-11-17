import type { DuckDBClient } from "./client";
import type { RuleCategory } from "@/lib/services/ruleIndex";

/**
 * Analytics queries for rule and schema statistics
 */
export class AnalyticsQueries {
  constructor(private client: DuckDBClient) {}

  /**
   * Get rule counts per field (for complexity calculations)
   */
  async getRuleCountsByField(
    fieldKey?: string,
    category?: RuleCategory
  ): Promise<Array<{ field_key: string; count: number }>> {
    let sql = `
      SELECT 
        target_field_key as field_key,
        COUNT(*) as count
      FROM rules
      WHERE 1=1
    `;

    if (fieldKey) {
      sql += ` AND target_field_key = '${fieldKey.replace(/'/g, "''")}'`;
    }

    if (category) {
      sql += ` AND category = '${category}'`;
    }

    sql += ` GROUP BY target_field_key ORDER BY count DESC`;

    const result = await this.client.query<{
      field_key: string;
      count: number;
    }>(sql);
    return result.rows;
  }

  /**
   * Get rule counts per object
   */
  async getRuleCountsByObject(): Promise<
    Array<{ object_name: string; category: string; count: number }>
  > {
    const result = await this.client.query<{
      object_name: string;
      category: string;
      count: number;
    }>(`
      SELECT 
        object_name,
        category,
        COUNT(*) as count
      FROM rules
      WHERE object_name IS NOT NULL
      GROUP BY object_name, category
      ORDER BY count DESC
    `);
    return result.rows;
  }

  /**
   * Get most-used fields across all rules
   */
  async getMostUsedFields(limit = 20): Promise<
    Array<{
      field_key: string;
      field_name: string;
      total_rules: number;
      email_rules: number;
      record_rules: number;
      display_rules: number;
    }>
  > {
    const result = await this.client.query<{
      field_key: string;
      field_name: string;
      total_rules: number;
      email_rules: number;
      record_rules: number;
      display_rules: number;
    }>(`
      SELECT 
        target_field_key as field_key,
        target_field_name as field_name,
        COUNT(*) as total_rules,
        SUM(CASE WHEN category = 'email' THEN 1 ELSE 0 END) as email_rules,
        SUM(CASE WHEN category = 'record' THEN 1 ELSE 0 END) as record_rules,
        SUM(CASE WHEN category = 'display' THEN 1 ELSE 0 END) as display_rules
      FROM rules
      GROUP BY target_field_key, target_field_name
      ORDER BY total_rules DESC
      LIMIT ${limit}
    `);
    return result.rows;
  }

  /**
   * Get rule distribution statistics
   */
  async getRuleDistribution(): Promise<{
    total: number;
    byCategory: Array<{ category: string; count: number; percentage: number }>;
    bySource: Array<{ source: string; count: number; percentage: number }>;
    fieldsWithRules: number;
    fieldsWithoutRules: number;
  }> {
    const [totalResult, byCategory, bySource, fieldStats] = await Promise.all([
      this.client.query<{ count: number }>(
        "SELECT COUNT(*) as count FROM rules"
      ),
      this.client.query<{ category: string; count: number }>(`
        SELECT 
          category,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM rules), 2) as percentage
        FROM rules
        GROUP BY category
        ORDER BY count DESC
      `),
      this.client.query<{ source: string; count: number }>(`
        SELECT 
          source,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM rules), 2) as percentage
        FROM rules
        GROUP BY source
        ORDER BY count DESC
      `),
      this.client.query<{
        fields_with_rules: number;
        total_fields: number;
      }>(`
        SELECT 
          COUNT(DISTINCT target_field_key) as fields_with_rules,
          (SELECT COUNT(*) FROM fields) as total_fields
        FROM rules
      `),
    ]);

    const total = totalResult.rows[0]?.count || 0;
    const stats = fieldStats.rows[0];
    const fieldsWithRules = stats?.fields_with_rules || 0;
    const totalFields = stats?.total_fields || 0;

    return {
      total,
      byCategory: byCategory.rows.map((r) => ({
        category: r.category,
        count: r.count,
        percentage: Number(r.count) * (100.0 / total),
      })),
      bySource: bySource.rows.map((r) => ({
        source: r.source,
        count: r.count,
        percentage: Number(r.count) * (100.0 / total),
      })),
      fieldsWithRules,
      fieldsWithoutRules: totalFields - fieldsWithRules,
    };
  }

  /**
   * Get rules by origin type (view, task, field)
   */
  async getRulesByOriginType(): Promise<
    Array<{ origin_type: string; count: number }>
  > {
    const result = await this.client.query<{
      origin_type: string;
      count: number;
    }>(`
      SELECT 
        origin_type,
        COUNT(*) as count
      FROM rules
      GROUP BY origin_type
      ORDER BY count DESC
    `);
    return result.rows;
  }
}

