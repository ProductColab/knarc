import type { KnackField } from "./types";
import { forwardRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { z } from "zod";
import { useKnackFieldForm } from "../hooks/useKnackFieldForm";
import { Input } from "@/components/ui/input";

// Types
export interface KnackMultipleChoiceFieldFormat {
  options: string[];
  type: "single" | "multi" | "checkboxes" | "radios";
  default?: string;
  blank?: string;
  sorting: "custom" | "alphabetical";
  [key: string]: unknown;
}

export type KnackMultipleChoiceFieldValue = string | string[];

export type KnackMultipleChoiceField = KnackField<
  "multiple_choice",
  KnackMultipleChoiceFieldFormat,
  KnackMultipleChoiceFieldValue
>;

export interface KnackMultipleChoiceFieldProps {
  value: KnackMultipleChoiceFieldValue;
  format: KnackMultipleChoiceFieldFormat;
  onChange?: (value: KnackMultipleChoiceFieldValue) => void;
  disabled?: boolean;
}

// Type guard
export function isMultipleChoiceField(
  field: unknown
): field is KnackMultipleChoiceField {
  return (
    typeof field === "object" &&
    field !== null &&
    "type" in field &&
    field.type === "multiple_choice"
  );
}

// Input Components
const SingleSelect = ({
  value,
  format,
  onChange,
  disabled,
}: KnackMultipleChoiceFieldProps) => (
  <Select value={value as string} onValueChange={onChange} disabled={disabled}>
    <FormControl>
      <SelectTrigger>
        <SelectValue placeholder={format.blank || "Select an option"} />
      </SelectTrigger>
    </FormControl>
    <SelectContent>
      {format.options.map((option) => (
        <SelectItem key={option} value={option}>
          {option}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

const CheckboxSelect = ({
  value,
  format,
  onChange,
  disabled,
}: KnackMultipleChoiceFieldProps) => {
  const selected = Array.isArray(value) ? value : [];

  const handleChange = (option: string, checked: boolean) => {
    if (!onChange) return;
    onChange(
      checked
        ? [...selected, option]
        : selected.filter((item) => item !== option)
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {format.options.map((option) => (
        <FormItem key={option} className="flex items-center space-x-2">
          <Checkbox
            checked={selected.includes(option)}
            onCheckedChange={(checked) =>
              handleChange(option, checked as boolean)
            }
            disabled={disabled}
          />
          <FormLabel className="font-normal">{option}</FormLabel>
        </FormItem>
      ))}
    </div>
  );
};

const RadioSelect = ({
  value,
  format,
  onChange,
  disabled,
}: KnackMultipleChoiceFieldProps) => (
  <RadioGroup
    value={value as string}
    onValueChange={onChange}
    disabled={disabled}
  >
    {format.options.map((option) => (
      <FormItem key={option} className="flex items-center space-x-2">
        <RadioGroupItem value={option} />
        <FormLabel className="font-normal">{option}</FormLabel>
      </FormItem>
    ))}
  </RadioGroup>
);

// Main Input Component
export const MultipleChoiceInput = forwardRef<
  HTMLDivElement,
  KnackMultipleChoiceFieldProps
>((props) => {
  const inputComponents = {
    single: SingleSelect,
    multi: CheckboxSelect,
    checkboxes: CheckboxSelect,
    radios: RadioSelect,
  };

  const Component = inputComponents[props.format.type];
  return <Component {...props} />;
});

MultipleChoiceInput.displayName = "MultipleChoiceInput";

// Display Component
export const MultipleChoiceDisplay = ({
  value,
}: {
  value: KnackMultipleChoiceFieldValue;
}) => <div>{Array.isArray(value) ? value.join(", ") : value}</div>;

MultipleChoiceDisplay.displayName = "MultipleChoiceDisplay";

// Format Configuration
const multipleChoiceFormatSchema = z.object({
  options: z.array(z.string()),
  type: z.enum(["single", "multi", "checkboxes", "radios"]),
  default: z.string().optional(),
  blank: z.string().optional(),
  sorting: z.enum(["custom", "alphabetical"]),
});

const inputTypeOptions = [
  { value: "single", label: "Single Select" },
  { value: "multi", label: "Multi Select" },
  { value: "checkboxes", label: "Checkboxes" },
  { value: "radios", label: "Radio Buttons" },
];

const sortingOptions = [
  { value: "custom", label: "Custom Order" },
  { value: "alphabetical", label: "Alphabetical" },
];

export const MultipleChoiceFormat = ({
  format,
  onChange,
  field,
}: {
  format: KnackMultipleChoiceFieldFormat;
  onChange: (format: KnackMultipleChoiceFieldFormat) => void;
  field?: KnackMultipleChoiceField;
}) => {
  const { form, handleChange } =
    useKnackFieldForm<KnackMultipleChoiceFieldFormat>({
      defaultValues: format,
      schema: multipleChoiceFormatSchema,
      onChange,
      field,
    });

  const { control } = form;

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="type"
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>Input Type</FormLabel>
            <Select
              onValueChange={(value) =>
                handleChange(
                  "type",
                  value as KnackMultipleChoiceFieldFormat["type"]
                )
              }
              defaultValue={formField.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select input type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {inputTypeOptions.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>How users will select options</FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="sorting"
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>Sort Options</FormLabel>
            <Select
              onValueChange={(value) =>
                handleChange(
                  "sorting",
                  value as KnackMultipleChoiceFieldFormat["sorting"]
                )
              }
              defaultValue={formField.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select sorting method" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {sortingOptions.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>How options should be sorted</FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="blank"
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>Blank Option Text</FormLabel>
            <FormControl>
              <Input
                placeholder="Select an option..."
                {...formField}
                onChange={(e) => handleChange("blank", e.target.value)}
              />
            </FormControl>
            <FormDescription>
              Text to show when no option is selected
            </FormDescription>
          </FormItem>
        )}
      />
    </div>
  );
};

MultipleChoiceFormat.displayName = "MultipleChoiceFormat";
