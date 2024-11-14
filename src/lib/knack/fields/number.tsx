import type { KnackField } from "./types";
import { forwardRef } from "react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useKnackFieldForm } from "../hooks/useKnackFieldForm";

// Types
export interface KnackNumberFieldFormat {
  default?: number;
  validation?: {
    min?: number;
    max?: number;
  };
  [key: string]: unknown;
}

export type KnackNumberFieldValue = number;

export interface KnackNumberFieldProps {
  value: KnackNumberFieldValue;
  format: KnackNumberFieldFormat;
  onChange?: (value: number) => void;
  disabled?: boolean;
}

export type KnackNumberField = KnackField<
  "number",
  KnackNumberFieldFormat,
  KnackNumberFieldValue
>;

// Utilities
export function isNumberField(field: unknown): field is KnackNumberField {
  return (
    typeof field === "object" &&
    field !== null &&
    "type" in field &&
    field.type === "number"
  );
}

// Format Configuration Component
const numberFormatSchema = z.object({
  default: z.number().optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
});

export const NumberFormat = ({
  format,
  onChange,
  field,
}: {
  format: KnackNumberFieldFormat;
  onChange: (format: KnackNumberFieldFormat) => void;
  field?: KnackNumberField;
}) => {
  const { form, handleChange } = useKnackFieldForm<
    "number",
    KnackNumberFieldFormat
  >({
    defaultValues: format,
    schema: numberFormatSchema,
    onChange,
    field,
  });

  const { control } = form;

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="default"
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>Default Value</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...formField}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  handleChange("default", isNaN(value) ? undefined : value);
                }}
              />
            </FormControl>
            <FormDescription>Default value for this field</FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="validation.min"
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>Minimum Value</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...formField}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  handleChange(
                    "validation.min",
                    isNaN(value) ? undefined : value
                  );
                }}
              />
            </FormControl>
            <FormDescription>Minimum allowed value</FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="validation.max"
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>Maximum Value</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...formField}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  handleChange(
                    "validation.max",
                    isNaN(value) ? undefined : value
                  );
                }}
              />
            </FormControl>
            <FormDescription>Maximum allowed value</FormDescription>
          </FormItem>
        )}
      />
    </div>
  );
};

// Input Component
export const NumberInput = forwardRef<HTMLDivElement, KnackNumberFieldProps>(
  ({ value, onChange, format, disabled }, ref) => {
    if (!onChange) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const numberValue = parseFloat(e.target.value);
      if (!isNaN(numberValue)) {
        onChange(numberValue);
      }
    };

    return (
      <div ref={ref}>
        <FormItem>
          <FormControl>
            <Input
              type="number"
              value={value}
              onChange={handleChange}
              disabled={disabled}
              min={format.validation?.min}
              max={format.validation?.max}
            />
          </FormControl>
        </FormItem>
      </div>
    );
  }
);

NumberInput.displayName = "NumberInput";

// Display Component
export const NumberDisplay = ({ value }: { value: number }) => {
  return <div>{value}</div>;
};

NumberDisplay.displayName = "NumberDisplay";
