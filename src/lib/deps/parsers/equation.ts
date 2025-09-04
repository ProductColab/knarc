export interface EquationReference {
  field_key: string;
  object_key?: string;
}

export interface EquationParseResult {
  referenced: EquationReference[];
}

/**
 * Main entry point for parsing a Knack equation string.
 * If referenced_fields is provided, uses it as ground truth.
 * Otherwise, extracts references heuristically from the equation string.
 */
export function parseEquation(
  equation: string,
  referenced_fields?: Record<
    string,
    {
      field_key: string;
      object_key: string;
      field_name: string;
      object_name: string;
    }
  >
): EquationParseResult {
  if (referenced_fields) {
    return {
      referenced: dedupeReferences(
        extractFromReferencedFields(referenced_fields)
      ),
    };
  }
  return {
    referenced: dedupeReferences(extractReferencesFromEquation(equation)),
  };
}

/**
 * Extracts references from the referenced_fields map.
 */
function extractFromReferencedFields(
  referenced_fields: Record<
    string,
    {
      field_key: string;
      object_key: string;
      field_name: string;
      object_name: string;
    }
  >
): EquationReference[] {
  return Object.values(referenced_fields).map((rf) => ({
    field_key: rf.field_key,
    object_key: rf.object_key,
  }));
}

/**
 * Heuristically extracts field and object.field references from the equation string.
 */
function extractReferencesFromEquation(equation: string): EquationReference[] {
  const refs: EquationReference[] = [];
  const objectFieldPattern = /(object_\d+)\.(field_\d+)/g;
  const fieldPattern = /field_\d+/g;

  let match: RegExpExecArray | null;

  // Extract object.field references
  while ((match = objectFieldPattern.exec(equation)) !== null) {
    refs.push({ object_key: match[1], field_key: match[2] });
  }

  // Extract field references not already matched as object.field
  while ((match = fieldPattern.exec(equation)) !== null) {
    refs.push({ field_key: match[0] });
  }

  return refs;
}

/**
 * Deduplicates EquationReference objects by object_key and field_key.
 */
function dedupeReferences(arr: EquationReference[]): EquationReference[] {
  const seen = new Set<string>();
  const out: EquationReference[] = [];
  for (const ref of arr) {
    const id = `${ref.object_key ?? "-"}:${ref.field_key}`;
    if (!seen.has(id)) {
      seen.add(id);
      out.push(ref);
    }
  }
  return out;
}
