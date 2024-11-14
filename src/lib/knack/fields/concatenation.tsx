import type { KnackField, KnackFieldBase } from "./types";

export interface KnackConcatenationFieldFormat extends KnackFieldBase {
  equation: string;
  equation_type: "numeric" | "text";
}

export type KnackConcatenationField = KnackField<
  "concatenation",
  KnackConcatenationFieldFormat,
  KnackConcatenationFieldValue
>;

export type KnackConcatenationFieldValue = string;

export interface KnackConcatenationFieldProps {
  value: string;
  format: KnackConcatenationFieldFormat;
  disabled?: boolean;
}

export function isConcatenationField(
  field: unknown
): field is KnackConcatenationField {
  return (
    typeof field === "object" &&
    field !== null &&
    "type" in field &&
    field.type === "concatenation"
  );
}

export const ConcatenationDisplay = ({
  value,
}: KnackConcatenationFieldProps) => {
  return <div>{value}</div>;
};

export const ConcatenationFormat = ({
  format,
}: KnackConcatenationFieldProps) => {
  return <div>{format.equation}</div>;
};
