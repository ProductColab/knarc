import type { KnackField, KnackFieldBase } from "./types";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useKnackFieldForm } from "../hooks/useKnackFieldForm";
import { forwardRef } from "react";

// Types
export interface KnackNameFieldFormat extends KnackFieldBase {
  show_title?: boolean;
  show_middle?: boolean;
  [key: string]: unknown;
}

export interface KnackNameFieldValue {
  title?: string;
  first?: string;
  middle?: string;
  last?: string;
}

export type KnackNameField = KnackField<
  "name",
  KnackNameFieldFormat,
  KnackNameFieldValue
>;

export interface KnackNameFieldProps {
  value: KnackNameFieldValue;
  onChange?: (value: KnackNameFieldValue) => void;
  format: KnackNameFieldFormat;
  disabled?: boolean;
}

// Utilities
export function isNameField(field: unknown): field is KnackNameField {
  return (
    typeof field === "object" &&
    field !== null &&
    "type" in field &&
    field.type === "name"
  );
}

// Format Configuration Component
const nameFormatSchema = z.object({
  name: z.string(),
  key: z.string(),
  label: z.string(),
  show_title: z.boolean().optional(),
  show_middle: z.boolean().optional(),
});

export const NameFormat = ({
  format,
  onChange,
  field,
}: {
  format: KnackNameFieldFormat;
  onChange: (format: KnackNameFieldFormat) => void;
  field?: KnackNameField;
}) => {
  const { form, handleChange } = useKnackFieldForm<
    "name",
    KnackNameFieldFormat
  >({
    defaultValues: format,
    schema: nameFormatSchema,
    onChange,
    field,
  });

  const { control } = form;

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="show_title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Show Title</FormLabel>
            <FormControl>
              <Switch
                checked={field.value as boolean}
                onCheckedChange={(checked) =>
                  handleChange("show_title", checked)
                }
              />
            </FormControl>
            <FormDescription>
              Show title field (Mr., Mrs., etc.)
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="show_middle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Show Middle Name</FormLabel>
            <FormControl>
              <Switch
                checked={field.value as boolean}
                onCheckedChange={(checked) =>
                  handleChange("show_middle", checked)
                }
              />
            </FormControl>
            <FormDescription>Show middle name field</FormDescription>
          </FormItem>
        )}
      />
    </div>
  );
};

// Input Component
export const NameInput = forwardRef<HTMLDivElement, KnackNameFieldProps>(
  ({ value, onChange, format, disabled }, ref) => {
    const handleFieldChange = (
      field: keyof KnackNameFieldValue,
      fieldValue: string
    ) => {
      if (!onChange) return;
      onChange({
        ...value,
        [field]: fieldValue,
      });
    };

    return (
      <div ref={ref} className="space-y-2">
        {format.show_title && (
          <Input
            placeholder="Title"
            value={value.title || ""}
            onChange={(e) => handleFieldChange("title", e.target.value)}
            disabled={disabled}
          />
        )}
        <Input
          placeholder="First Name"
          value={value.first || ""}
          onChange={(e) => handleFieldChange("first", e.target.value)}
          disabled={disabled}
        />
        {format.show_middle && (
          <Input
            placeholder="Middle Name"
            value={value.middle || ""}
            onChange={(e) => handleFieldChange("middle", e.target.value)}
            disabled={disabled}
          />
        )}
        <Input
          placeholder="Last Name"
          value={value.last || ""}
          onChange={(e) => handleFieldChange("last", e.target.value)}
          disabled={disabled}
        />
      </div>
    );
  }
);

NameInput.displayName = "NameInput";

// Display Component
export const NameDisplay = ({ value }: { value: KnackNameFieldValue }) => {
  const parts = [value.title, value.first, value.middle, value.last].filter(
    Boolean
  );

  return <div>{parts.join(" ")}</div>;
};

NameDisplay.displayName = "NameDisplay";
