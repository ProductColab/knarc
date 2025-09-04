import { KnackField } from "../field";

// Base interface for formula fields with numeric formatting
export interface NumericFormulaField extends KnackField {
  format: {
    raw: boolean;
    negative_only: boolean;
    currency: boolean;
    decimals: number;
  };
}

// Base interface for formula fields with equation formatting
export interface EquationFormatField extends KnackField {
  format: {
    equation?: string;
    equation_type?: string;
    count_field?: string;
    formula_field?: string;
  };
}

// Concatenation field type
export interface ConcatenationField extends EquationFormatField {
  type: "concatenation";
  format: EquationFormatField["format"] & {
    values?: Array<{
      type: string;
      field?: string;
      value?: string;
    }>;
  };
}

// Sum field type
export interface SumField extends NumericFormulaField {
  type: "sum";
  format: NumericFormulaField["format"] & {
    field: { key: string }; // The field to sum
    connection?: { key: string }; // Optional connection with key property
  };
}

// Count field type
export interface CountField extends KnackField {
  type: "count";
  format: {
    pre?: string;
    post?: string;
    format?: string;
    rounding?: string;
    precision?: string;
    connection: string;
    count_field: string;
    mark_decimal?: string;
    mark_thousands?: string;
  };
}

// Equation field type
export interface EquationField extends NumericFormulaField {
  type: "equation";
  format: NumericFormulaField["format"] & {
    equation: string; // The equation formula
    referenced_fields?: {
      [key: string]: {
        field_key: string;
        object_key: string;
        field_name: string;
        object_name: string;
      };
    };
  };
}

// Type guard functions
export function isFormulaField(
  field: KnackField
): field is NumericFormulaField {
  return ["sum", "equation", "concatenation", "count"].includes(field.type);
}

export function isEquationField(field: KnackField): field is EquationField {
  return field.type === "equation";
}

export function isSumField(field: KnackField): field is SumField {
  return field.type === "sum";
}

export function isConcatenationField(
  field: KnackField
): field is ConcatenationField {
  return field.type === "concatenation";
}

export function isCountField(field: KnackField): field is CountField {
  return field.type === "count";
}
