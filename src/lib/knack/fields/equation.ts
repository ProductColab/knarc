import type { KnackFieldBase, KnackFieldFormatBase } from "./types";

export interface KnackEquationFieldFormat extends KnackFieldFormatBase {
  equation: string;
  equation_type: "numeric" | "text" | "date";
  count_field: "Connection" | "Field";
  formula_field: "Field" | "Connection";
  date_type?: "hours" | "days" | "months" | "years";
  date_result?: "number" | "date";
  date_format?: string;
  time_format?: string;
  format?: string;
  mark_decimal?: "period" | "comma" | "none";
  mark_thousands?: "period" | "comma" | "none";
  pre?: string;
  post?: string;
  precision?: string;
  rounding?: "none" | "up" | "down" | "nearest";
}

export type KnackEquationField = KnackFieldBase<
  "equation",
  KnackEquationFieldFormat
>;

export interface KnackEquationFieldProps {
  value: number | string | Date;
  format: KnackEquationFieldFormat;
  disabled?: boolean;
}

export function isEquationField(field: unknown): field is KnackEquationField {
  return (
    typeof field === "object" &&
    field !== null &&
    "type" in field &&
    field.type === "equation"
  );
}
