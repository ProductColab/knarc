import type { KnackField } from "./types";
import { Input } from "@/components/ui/input";
import { forwardRef } from "react";
import { useForm } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useKnackFieldForm } from "../hooks/useKnackFieldForm";

/**
 * Format options for text fields
 */
export interface KnackTextFieldFormat {
  [key: string]: unknown;
}

/**
 * Value type for text fields
 */
export type KnackTextFieldValue = string;

/**
 * Props for text field components
 */
export interface KnackTextFieldProps {
  /** Current text value */
  value: KnackTextFieldValue;
  /** Field format configuration */
  format: KnackTextFieldFormat;
  /** Change handler */
  onChange?: (value: KnackTextFieldValue) => void;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * A Knack text field definition
 */
export type KnackTextField = KnackField<
  "short_text",
  KnackTextFieldFormat,
  KnackTextFieldValue
>;

/**
 * Type guard to check if a field is a text field
 */
export function isTextField(field: unknown): field is KnackTextField {
  return (
    typeof field === "object" &&
    field !== null &&
    "type" in field &&
    field.type === "short_text"
  );
}

// Format Configuration Component
const textFormatSchema = z.object({
  name: z.string(),
  key: z.string(),
  label: z.string(),
  description: z.string().optional(),
  required: z.boolean().optional(),
  default: z.string().optional(),
  validation: z
    .object({
      type: z.enum(["email", "url", "phone", "rich_text"]).optional(),
      length: z
        .object({
          min: z.number().optional(),
          max: z.number().optional(),
        })
        .optional(),
      pattern: z.string().optional(),
    })
    .optional(),
});

export const TextFormat = ({
  format,
  onChange,
  field,
}: {
  format: KnackTextFieldFormat;
  onChange: (format: KnackTextFieldFormat) => void;
  field?: KnackTextField;
}) => {
  const { form, handleChange } = useKnackFieldForm<
    "short_text",
    KnackTextFieldFormat
  >({
    defaultValues: format,
    schema: textFormatSchema,
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
                {...formField}
                value={(formField.value as string) || ""}
                onChange={(e) => handleChange("default", e.target.value)}
              />
            </FormControl>
            <FormDescription>
              Default text when creating new records
            </FormDescription>
          </FormItem>
        )}
      />
    </div>
  );
};

/**
 * Main input component for text fields
 */
export const TextInput = forwardRef<HTMLInputElement, KnackTextFieldProps>(
  ({ value, onChange, disabled, placeholder }, ref) => {
    const { control } = useForm<{ text: string }>({
      defaultValues: { text: value },
      resolver: zodResolver(
        z.object({
          text: z.string(),
        })
      ),
    });

    return (
      <FormField
        control={control}
        name="text"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                {...field}
                placeholder={placeholder}
                disabled={disabled}
                value={value}
                onChange={(e) => {
                  field.onChange(e);
                  onChange?.(e.target.value);
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />
    );
  }
);

TextInput.displayName = "TextInput";

/**
 * Display component for text fields
 */
export const TextDisplay = ({ value }: { value: string }) => {
  return <div>{value}</div>;
};

TextDisplay.displayName = "TextDisplay";
