import { FieldWithObject } from "@/lib/knack/types/field";
import {
  isEquationField,
  isConcatenationField,
  isSumField
} from "@/lib/knack/types/fields/formula";

export function getFormulaDisplay(field: FieldWithObject): string {
  if (isEquationField(field)) {
    return field.format.equation;
  }
  if (isConcatenationField(field)) {
    if (field.format.equation) {
      return field.format.equation;
    }
    if (field.format.values) {
      return JSON.stringify(field.format.values, null, 2);
    }
  }
  if (isSumField(field)) {
    return JSON.stringify(
      {
        field: field.format.field,
        connection: field.format.connection,
      },
      null,
      2
    );
  }
  return JSON.stringify(field.format, null, 2);
} 