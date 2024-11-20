import { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { FormulaFieldDependency, FieldWithObject } from "@/lib/knack/types/field";
import { isEquationField, isConcatenationField, isSumField } from "@/lib/knack/types/fields/formula";

export type FieldDependencyNode = {
  field: FieldWithObject;
  dependencies: FieldDependencyNode[];
  dependents: FieldDependencyNode[];
}

export async function getAllFields(
  conn: AsyncDuckDBConnection,
  configId: number
): Promise<FieldWithObject[]> {
  console.log("🔍 Getting all fields for config:", configId);

  try {
    // First check if we have any fields
    const countResult = await conn.query(`
      SELECT COUNT(*) as count
      FROM fields
      WHERE config_id = ${configId}
    `);

    const count = countResult.get(0)?.count;
    console.log("📊 Found", count, "fields in database");

    if (count === 0) {
      console.log("⚠️ No fields found for config");
      return [];
    }

    const result = await conn.query(`
      SELECT 
        f.field,
        o.object,
        f.object_key
      FROM fields f
      JOIN objects o ON f.config_id = o.config_id AND f.object_key = o.key
      WHERE f.config_id = ${configId}
      ORDER BY o.object->>'name', f.field->>'name'
    `);

    const fields = result.toArray().map(row => ({
      ...JSON.parse(row.field),
      objectName: JSON.parse(row.object).name,
      objectKey: row.object_key
    }));

    console.log("✅ Successfully mapped", fields.length, "fields");
    return fields;
  } catch (error) {
    console.error("❌ Error getting fields:", error);
    throw error;
  }
}

export async function getFieldDependencies(
  conn: AsyncDuckDBConnection,
  configId: number,
  objectKey: string,
  fieldKey: string
): Promise<FormulaFieldDependency | null> {
  console.log("🔍 Getting dependencies for:", { configId, objectKey, fieldKey });

  // Get the source field
  const sourceResult = await conn.query(`
    SELECT 
      f.field,
      o.object
    FROM fields f
    JOIN objects o ON f.config_id = o.config_id AND f.object_key = o.key
    WHERE f.config_id = ${configId}
      AND f.object_key = '${objectKey}'
      AND f.key = '${fieldKey}'
  `);

  const sourceRow = sourceResult.get(0);
  if (!sourceRow) {
    console.log("⚠️ No source field found");
    return null;
  }

  const sourceField = {
    ...JSON.parse(sourceRow.field),
    objectName: JSON.parse(sourceRow.object).name,
    objectKey
  };

  console.log("📄 Source field:", sourceField);

  // Get referenced fields based on field type
  let referencedKeys: string[] = [];
  let formula: string | undefined;

  if (isEquationField(sourceField)) {
    formula = sourceField.format.equation;
    referencedKeys = Object.values(sourceField.format.referenced_fields || {})
      .map(ref => ref.field_key);
    console.log("📐 Equation field references:", referencedKeys);
  } else if (isConcatenationField(sourceField)) {
    console.log("🔗 Concatenation field format:", sourceField.format);

    // Handle concatenation fields that actually use equation format
    if (sourceField.format.equation) {
      formula = sourceField.format.equation;
      // Extract field keys from equation string (format: either {objectKey.fieldKey} or {fieldKey})
      const fieldMatches = sourceField.format.equation.match(/\{([^}]+)\}/g) || [];
      referencedKeys = fieldMatches.map(match => {
        // Remove the curly braces
        const innerMatch = match.slice(1, -1);
        // If there's a dot, take the part after the dot, otherwise use the whole key
        const fieldKey = innerMatch.includes('.') ?
          innerMatch.split('.')[1] :
          innerMatch;
        console.log("📍 Extracted field key from equation:", fieldKey);
        return fieldKey;
      }).filter(Boolean);
    } else if (sourceField.format.values) {
      // Handle traditional concatenation format
      referencedKeys = sourceField.format.values
        .filter(v => {
          console.log("🔍 Checking value:", v);
          return v.type === 'field';
        })
        .map(v => {
          console.log("📍 Mapping field key:", v.field);
          return v.field!;
        })
        .filter(Boolean);
    }
    console.log("🔗 Concatenation field references:", referencedKeys);
  } else if (isSumField(sourceField)) {
    referencedKeys = [sourceField.format.field.key];
    console.log("➕ Sum field references:", referencedKeys);
  }

  // Get the target fields
  if (referencedKeys.length === 0) {
    console.log("⚠️ No referenced fields found");
    return null;
  }

  const targetQuery = `
    SELECT 
      f.field,
      o.object,
      f.object_key
    FROM fields f
    JOIN objects o ON f.config_id = o.config_id AND f.object_key = o.key
    WHERE f.config_id = ${configId}
      AND f.key IN (${referencedKeys.map(k => `'${k}'`).join(',')})
  `;

  console.log("🔍 Target fields query:", targetQuery);
  try {
    const targetResult = await conn.query(targetQuery);
    console.log("🎯 Raw target result:", targetResult.toArray());

    const targetFields: FieldWithObject[] = targetResult.toArray().map(row => {
      console.log("📄 Processing target row:", row);
      return {
        ...JSON.parse(row.field),
        objectName: JSON.parse(row.object).name,
        objectKey: row.object_key
      };
    });

    console.log("🎯 Found target fields:", targetFields);

    const result = {
      sourceField: sourceField as FieldWithObject,
      targetFields,
      formula
    };

    console.log("✅ Final dependency result:", result);
    return result;
  } catch (error) {
    console.error("❌ Error querying target fields:", error);
    throw error;
  }
}

// Example of a more complex analysis query
export async function getFieldUsageStats(
  conn: AsyncDuckDBConnection,
  configId: number
) {
  return conn.query(`
    WITH field_types AS (
      SELECT 
        JSON_EXTRACT_STRING(field, '$.type') as field_type,
        COUNT(*) as count
      FROM fields
      WHERE config_id = ${configId}
      GROUP BY JSON_EXTRACT_STRING(field, '$.type')
    ),
    formula_fields AS (
      SELECT 
        o.object->>'name' as object_name,
        f.field->>'name' as field_name,
        JSON_EXTRACT_STRING(f.field, '$.type') as formula_type,
        CASE 
          WHEN JSON_EXTRACT_STRING(f.field, '$.type') = 'equation' 
          THEN JSON_EXTRACT_STRING(f.field, '$.format.equation')
          WHEN JSON_EXTRACT_STRING(f.field, '$.type') = 'sum'
          THEN JSON_EXTRACT_STRING(f.field, '$.format.field')
          ELSE NULL
        END as formula
      FROM fields f
      JOIN objects o ON f.config_id = o.config_id AND f.object_key = o.key
      WHERE f.config_id = ${configId}
      AND JSON_EXTRACT_STRING(f.field, '$.type') IN ('equation', 'sum', 'concatenation')
    )
    SELECT 
      field_types.*,
      (
        SELECT COUNT(*)
        FROM formula_fields
        WHERE formula_type = field_types.field_type
      ) as formula_count
    FROM field_types
    ORDER BY count DESC
  `);
} 