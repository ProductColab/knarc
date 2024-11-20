import { ShortTextField } from "./fields/short-text";
import { EquationField, SumField, ConcatenationField } from "./fields/formula";

// Field types constants
export const SHORT_TEXT = 'short_text' as const;
export const EQUATION = 'equation' as const;
export const SUM = 'sum' as const;
export const CONCATENATION = 'concatenation' as const;

// Base field interface
export interface KnackField {
  key: string;
  name: string;
  description?: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  user?: boolean;
  conditional?: boolean;
  rules?: unknown[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    type?: string;
  };
  format?: {
    [key: string]: unknown;
  };
}

// Union type of all field types
export type KnackFieldType =
  | ShortTextField
  | EquationField
  | SumField
  | ConcatenationField
  // Add other field types here
  ;

// Helper type for fields with object context
export interface FieldWithObject extends KnackField {
  objectName: string;
  objectKey: string;
  format: KnackFieldType['format'];
}

// Helper type for formula fields with dependencies
export interface FormulaFieldDependency {
  sourceField: FieldWithObject;
  targetFields: FieldWithObject[];
  formula?: string;
}

// Type guard to check if a field is a specific field type
export function isFieldType<T extends KnackFieldType>(
  field: FieldWithObject,
  type: T['type']
): field is FieldWithObject & T {
  return field.type === type;
}
