import type { KnackField, KnackFieldBase } from "./types";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface KnackAutoIncrementFieldFormat extends KnackFieldBase {}

export type KnackAutoIncrementField = KnackField<
  "auto_increment",
  KnackAutoIncrementFieldFormat,
  KnackAutoIncrementFieldValue
>;

export type KnackAutoIncrementFieldValue = number;

export interface KnackAutoIncrementFieldProps {
  value: number;
  format: KnackAutoIncrementFieldFormat;
  disabled: true;
}

export function isAutoIncrementField(
  field: unknown
): field is KnackAutoIncrementField {
  return (
    typeof field === "object" &&
    field !== null &&
    "type" in field &&
    field.type === "auto_increment"
  );
}

export const AutoIncrementDisplay = ({
  value,
}: KnackAutoIncrementFieldProps) => {
  return <div>{value}</div>;
};
