import { Path, PathValue, useForm, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { KnackField } from "@/lib/knack/fields/types";
import { KnackFieldType, KnackFieldFormat } from "@/lib/knack/types/fields";

export function useKnackFieldForm<
  TFieldType extends KnackFieldType,
  TFieldFormat extends KnackFieldFormat,
  TFieldValue = unknown
>({
  defaultValues,
  schema,
  onChange,
  field,
}: {
  defaultValues: TFieldFormat;
  schema: z.ZodSchema<TFieldFormat>;
  onChange?: (values: TFieldFormat) => void;
  field?: KnackField<TFieldType, TFieldFormat, TFieldValue>;
}) {
  // Add required validation if field is required
  const validationSchema = field?.required
    ? schema.superRefine((data, ctx) => {
      if (data.value == null || data.value === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "This field is required",
          path: ["value"],
        });
      }
    })
    : schema;

  const form = useForm<TFieldFormat>({
    defaultValues: defaultValues as DefaultValues<TFieldFormat>,
    resolver: zodResolver(validationSchema),
  });

  const handleChange = <K extends keyof TFieldFormat>(
    field: K,
    value: TFieldFormat[K]
  ) => {
    const path = field.toString() as Path<TFieldFormat>;
    form.setValue(path, value as PathValue<TFieldFormat, Path<TFieldFormat>>);
    if (onChange) {
      const updatedValues = {
        ...form.getValues(),
        [field]: value,
      };
      onChange(updatedValues);
    }
  };

  return {
    form,
    handleChange,
  };
}
