import type { KnackField } from "./types";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { useKnackFieldForm } from "../hooks/useKnackFieldForm";

// Types
export interface KnackLinkFieldFormat {
  target: "_self" | "_blank";
  text_format: "unique" | string;
  [key: string]: unknown;
}

export interface KnackLinkValue {
  url: string;
  label?: string;
}

export interface KnackLinkFieldProps {
  value: KnackLinkValue;
  format: KnackLinkFieldFormat;
  onChange?: (value: KnackLinkValue) => void;
  disabled?: boolean;
}

export type KnackLinkField = KnackField<
  "link",
  KnackLinkFieldFormat,
  KnackLinkValue
>;

// Utilities
export function isLinkField(field: unknown): field is KnackLinkField {
  return (
    typeof field === "object" &&
    field !== null &&
    "type" in field &&
    field.type === "link"
  );
}

// Format Configuration Component
const linkFormatSchema = z.object({
  target: z.enum(["_self", "_blank"]),
  text_format: z.string(),
});

export const LinkFormat = ({
  format,
  onChange,
  field,
}: {
  format: KnackLinkFieldFormat;
  onChange: (format: KnackLinkFieldFormat) => void;
  field?: KnackLinkField;
}) => {
  const { form, handleChange } = useKnackFieldForm<
    "link",
    KnackLinkFieldFormat
  >({
    defaultValues: format,
    schema: linkFormatSchema,
    onChange,
    field,
  });

  const { control } = form;

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="target"
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>Link Target</FormLabel>
            <Select
              onValueChange={(value) =>
                handleChange("target", value as KnackLinkFieldFormat["target"])
              }
              defaultValue={formField.value as string}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="_self">Same Window</SelectItem>
                <SelectItem value="_blank">New Window</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Where the link should open when clicked
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="text_format"
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>Link Text Format</FormLabel>
            <FormControl>
              <Input
                {...formField}
                value={(formField.value as string) || ""}
                onChange={(e) => handleChange("text_format", e.target.value)}
              />
            </FormControl>
            <FormDescription>
              Format for the link text display (use "unique" for URL)
            </FormDescription>
          </FormItem>
        )}
      />
    </div>
  );
};
