import type { KnackField } from "./types";
import { forwardRef } from "react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";
import { useKnackFieldForm } from "../hooks/useKnackFieldForm";

// Types
export interface KnackBooleanFieldFormat {
  format: "yes_no" | "true_false" | "1_0";
  input: "checkbox" | "radio" | "dropdown";
  default: boolean;
  [key: string]: unknown;
}

export type KnackBooleanFieldValue = boolean;

export interface KnackBooleanFieldProps {
  value: KnackBooleanFieldValue;
  format: KnackBooleanFieldFormat;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
}

export type KnackBooleanField = KnackField<
  "boolean",
  KnackBooleanFieldFormat,
  KnackBooleanFieldValue
>;

// Utilities
export function isBooleanField(field: unknown): field is KnackBooleanField {
  return (
    typeof field === "object" &&
    field !== null &&
    "type" in field &&
    field.type === "boolean"
  );
}

const getDisplayValue = (
  value: boolean,
  format: KnackBooleanFieldFormat["format"]
) => {
  switch (format) {
    case "yes_no":
      return value ? "Yes" : "No";
    case "true_false":
      return value ? "True" : "False";
    case "1_0":
      return value ? "1" : "0";
  }
};

// Format Configuration Component
const booleanFormatSchema = z.object({
  format: z.enum(["yes_no", "true_false", "1_0"]),
  input: z.enum(["radio", "checkbox", "dropdown"]),
  default: z.boolean(),
});

export const BooleanFormat = ({
  format,
  onChange,
  field,
}: {
  format: KnackBooleanFieldFormat;
  onChange: (format: KnackBooleanFieldFormat) => void;
  field?: KnackBooleanField;
}) => {
  const { form, handleChange } = useKnackFieldForm<
    "boolean",
    KnackBooleanFieldFormat
  >({
    defaultValues: format,
    schema: booleanFormatSchema,
    onChange,
    field,
  });

  const { control } = form;

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="format"
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>Display Format</FormLabel>
            <Select
              onValueChange={(value) =>
                handleChange(
                  "format",
                  value as KnackBooleanFieldFormat["format"]
                )
              }
              defaultValue={formField.value as string}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="yes_no">Yes/No</SelectItem>
                <SelectItem value="true_false">True/False</SelectItem>
                <SelectItem value="1_0">1/0</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              How the boolean value should be displayed
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="input"
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>Input Type</FormLabel>
            <Select
              onValueChange={(value) =>
                handleChange("input", value as KnackBooleanFieldFormat["input"])
              }
              defaultValue={formField.value as string}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select input type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="radio">Radio Buttons</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="dropdown">Dropdown</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>How users will input the value</FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="default"
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>Default Value</FormLabel>
            <FormControl>
              <Switch
                checked={formField.value as boolean}
                onCheckedChange={(checked) => handleChange("default", checked)}
              />
            </FormControl>
            <FormDescription>Default value for new records</FormDescription>
          </FormItem>
        )}
      />
    </div>
  );
};

// Input Components
const CheckboxInput = ({
  value,
  onChange,
  disabled,
}: KnackBooleanFieldProps) => {
  if (!onChange) return null;

  return (
    <FormItem>
      <FormControl>
        <Checkbox
          checked={value}
          onCheckedChange={onChange}
          disabled={disabled}
        />
      </FormControl>
    </FormItem>
  );
};

CheckboxInput.displayName = "CheckboxInput";

const RadioInput = ({
  value,
  onChange,
  format,
  disabled,
}: KnackBooleanFieldProps) => {
  if (!onChange) return null;

  return (
    <RadioGroup
      defaultValue={value.toString()}
      onValueChange={(val) => onChange(val === "true")}
      disabled={disabled}
    >
      <div className="flex items-center space-x-4">
        <FormItem>
          <FormControl>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="true" />
              <FormLabel htmlFor="true">
                {getDisplayValue(true, format.format)}
              </FormLabel>
            </div>
          </FormControl>
        </FormItem>
        <FormItem>
          <FormControl>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="false" />
              <FormLabel htmlFor="false">
                {getDisplayValue(false, format.format)}
              </FormLabel>
            </div>
          </FormControl>
        </FormItem>
      </div>
    </RadioGroup>
  );
};

RadioInput.displayName = "RadioInput";

const DropdownInput = ({
  value,
  onChange,
  format,
  disabled,
}: KnackBooleanFieldProps) => {
  if (!onChange) return null;

  return (
    <Select
      onValueChange={(val) => onChange(val === "true")}
      defaultValue={value.toString()}
      disabled={disabled}
    >
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder="Select value" />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        <SelectItem value="true">
          {getDisplayValue(true, format.format)}
        </SelectItem>
        <SelectItem value="false">
          {getDisplayValue(false, format.format)}
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

DropdownInput.displayName = "DropdownInput";

// Main Input Component
export const BooleanInput = forwardRef<HTMLDivElement, KnackBooleanFieldProps>(
  (props) => {
    switch (props.format.input) {
      case "checkbox":
        return <CheckboxInput {...props} />;
      case "radio":
        return <RadioInput {...props} />;
      case "dropdown":
        return <DropdownInput {...props} />;
    }
  }
);

BooleanInput.displayName = "BooleanInput";

// Display Component
export const BooleanDisplay = ({
  value,
  format,
}: {
  value: boolean;
  format: KnackBooleanFieldFormat;
}) => <div>{getDisplayValue(value, format.format)}</div>;

BooleanDisplay.displayName = "BooleanDisplay";
