import type { DuckDBClient } from "./client";
import type { RuleCategory } from "@/lib/services/ruleIndex";

/**
 * Helper functions to optimize complexity calculations using DuckDB
 * These provide fast rule counts that can be combined with graph-based filtering
 */
export class ComplexityHelpers {
  constructor(private client: DuckDBClient) {}

  /**
   * Get rule count for a field (all rules)
   * This is faster than filtering graph edges for simple counts
   */
  async getRuleCountForField(fieldKey: string): Promise<number> {
    const result = await this.client.query<{ count: number }>(`
      SELECT COUNT(*) as count
      FROM rules
      WHERE target_field_key = '${fieldKey.replace(/'/g, "''")}'
    `);
    return result.rows[0]?.count || 0;
  }

  /**
   * Get rule count for a field by category
   */
  async getRuleCountForFieldByCategory(
    fieldKey: string,
    category: RuleCategory
  ): Promise<number> {
    const result = await this.client.query<{ count: number }>(`
      SELECT COUNT(*) as count
      FROM rules
      WHERE target_field_key = '${fieldKey.replace(/'/g, "''")}'
        AND category = '${category}'
    `);
    return result.rows[0]?.count || 0;
  }

  /**
   * Get all rule counts for a field (by category)
   * Returns a map of category -> count
   */
  async getRuleCountsForField(
    fieldKey: string
  ): Promise<Map<RuleCategory, number>> {
    const result = await this.client.query<{
      category: string;
      count: number;
    }>(`
      SELECT 
        category,
        COUNT(*) as count
      FROM rules
      WHERE target_field_key = '${fieldKey.replace(/'/g, "''")}'
      GROUP BY category
    `);

    const counts = new Map<RuleCategory, number>();
    for (const row of result.rows) {
      if (row.category === "email" || row.category === "record" || row.category === "display") {
        counts.set(row.category as RuleCategory, row.count);
      }
    }
    return counts;
  }

  /**
   * Batch get rule counts for multiple fields
   * More efficient than individual queries
   */
  async getRuleCountsForFields(
    fieldKeys: string[]
  ): Promise<Map<string, Map<RuleCategory, number>>> {
    if (fieldKeys.length === 0) {
      return new Map();
    }

    const keys = fieldKeys.map((k) => `'${k.replace(/'/g, "''")}'`).join(",");
    const result = await this.client.query<{
      target_field_key: string;
      category: string;
      count: number;
    }>(`
      SELECT 
        target_field_key,
        category,
        COUNT(*) as count
      FROM rules
      WHERE target_field_key IN (${keys})
      GROUP BY target_field_key, category
    `);

    const fieldCounts = new Map<string, Map<RuleCategory, number>>();
    for (const row of result.rows) {
      if (!fieldCounts.has(row.target_field_key)) {
        fieldCounts.set(row.target_field_key, new Map());
      }
      const categoryMap = fieldCounts.get(row.target_field_key)!;
      if (
        row.category === "email" ||
        row.category === "record" ||
        row.category === "display"
      ) {
        categoryMap.set(row.category as RuleCategory, row.count);
      }
    }

    return fieldCounts;
  }
}

