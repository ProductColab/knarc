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
export interface KnackEmailFieldFormat {
  default?: string;
  [key: string]: unknown;
}

export interface KnackEmailFieldValue {
  email: string;
  label?: string;
}

export interface KnackEmailFieldProps {
  value: KnackEmailFieldValue;
  format: KnackEmailFieldFormat;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export type KnackEmailField = KnackField<
  "email",
  KnackEmailFieldFormat,
  KnackEmailFieldValue
>;

// Utilities
export function isEmailField(field: unknown): field is KnackEmailField {
  return (
    typeof field === "object" &&
    field !== null &&
    "type" in field &&
    field.type === "email"
  );
}

// Format Configuration Component
const emailFormatSchema = z.object({
  name: z.string(),
  key: z.string(),
  label: z.string(),
  description: z.string().optional(),
  required: z.boolean().optional(),
  default: z.string().optional(),
  validation: z
    .object({
      type: z.literal("email"),
    })
    .optional(),
});

export const EmailFormat = ({
  format,
  onChange,
  field,
}: {
  format: KnackEmailFieldFormat;
  onChange: (format: KnackEmailFieldFormat) => void;
  field?: KnackEmailField;
}) => {
  const { form, handleChange } = useKnackFieldForm<
    "email",
    KnackEmailFieldFormat
  >({
    defaultValues: format,
    schema: emailFormatSchema,
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
                type="email"
                {...formField}
                value={(formField.value as string) || ""}
                onChange={(e) => handleChange("default", e.target.value)}
              />
            </FormControl>
            <FormDescription>
              Default email address when creating new records
            </FormDescription>
          </FormItem>
        )}
      />
    </div>
  );
};

// Input Component
export const EmailInput = forwardRef<HTMLInputElement, KnackEmailFieldProps>(
  ({ value, onChange, disabled }, ref) => {
    return (
      <Input
        ref={ref}
        type="email"
        value={value.email}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className="w-full"
      />
    );
  }
);

EmailInput.displayName = "EmailInput";

// Display Component
export const EmailDisplay = ({ value }: { value: string }) => {
  if (!value) {
    return <div>No email address</div>;
  }

  return (
    <a href={`mailto:${value}`} className="text-blue-600 hover:underline">
      {value}
    </a>
  );
};

EmailDisplay.displayName = "EmailDisplay";
