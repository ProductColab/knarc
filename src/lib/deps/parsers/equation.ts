// Lightweight parser for Knack equation strings
// Strategy: If referenced_fields map is present, use it as ground truth.
// Otherwise, heuristically extract tokens like field_123 and object_45.field_67

export interface EquationReference {
  field_key: string;
  object_key?: string;
}

export interface EquationParseResult {
  referenced: EquationReference[];
}

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
  const refs: EquationReference[] = [];
  if (referenced_fields) {
    for (const key of Object.keys(referenced_fields)) {
      const rf = referenced_fields[key];
      refs.push({ field_key: rf.field_key, object_key: rf.object_key });
    }
    return { referenced: dedupe(refs) };
  }
  // Heuristic fallback
  const fieldPattern = /field_\d+/g;
  const objectFieldPattern = /(object_\d+)\.(field_\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = objectFieldPattern.exec(equation)) !== null) {
    refs.push({ object_key: m[1], field_key: m[2] });
  }
  while ((m = fieldPattern.exec(equation)) !== null) {
    refs.push({ field_key: m[0] });
  }
  return { referenced: dedupe(refs) };
}

function dedupe(arr: EquationReference[]): EquationReference[] {
  const seen = new Set<string>();
  const out: EquationReference[] = [];
  for (const r of arr) {
    const id = `${r.object_key ?? "-"}:${r.field_key}`;
    if (!seen.has(id)) {
      seen.add(id);
      out.push(r);
    }
  }
  return out;
}
