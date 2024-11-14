import { forwardRef, useState } from "react";
import { z } from "zod";
import type { KnackField, KnackFieldValue } from "./types";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useKnackFieldForm } from "../hooks/useKnackFieldForm";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Format options for connection fields
 */
export interface KnackConnectionFieldFormat {
  /** Field to display from connected records */
  display_field?: string;
  /** Whether to allow multiple connections */
  allow_multiple?: boolean;
  /** Whether to enable searching connections */
  enable_search?: boolean;
  /** Label for the field */
  label: string;
  /** Description of the field */
  description?: string;
  /** Whether the field is required */
  required?: boolean;
  [key: string]: unknown;
}

/**
 * A Knack connection record
 */
export interface KnackConnectionRecord {
  /** The ID of the record */
  id: string;
  /** The identifier of the record. This is a setting in the parent object. */
  identifier: KnackFieldValue;
  [key: string]: unknown;
}

/**
 * A Knack connection field definition
 */
export type KnackConnectionField = KnackField<
  "connection",
  KnackConnectionFieldFormat,
  KnackConnectionRecord[]
>;

export interface KnackConnectionFieldProps {
  value: KnackConnectionRecord[];
  onChange?: (value: KnackConnectionRecord[]) => void;
  format: KnackConnectionFieldFormat;
  disabled?: boolean;
  onSearch?: (query: string) => Promise<KnackConnectionRecord[]>;
}

export function isConnectionField(
  field: unknown
): field is KnackConnectionField {
  return (
    typeof field === "object" &&
    field !== null &&
    "type" in field &&
    field.type === "connection"
  );
}

/**
 * Display component for connection fields
 */
export const ConnectionDisplay = ({
  value,
  format,
}: KnackConnectionFieldProps) => {
  if (!value || value.length === 0) {
    return <div>No connections</div>;
  }

  return (
    <div>
      {value.map((record, index) => (
        <div key={index}>
          {format.display_field
            ? String(record[format.display_field])
            : JSON.stringify(record)}
        </div>
      ))}
    </div>
  );
};

const connectionFormatSchema = z.object({
  name: z.string(),
  key: z.string(),
  label: z.string(),
  description: z.string().optional(),
  required: z.boolean().optional(),
  display_field: z.string().optional(),
  allow_multiple: z.boolean().optional(),
  enable_search: z.boolean().optional(),
});

/**
 * Component for configuring connection field format options
 */
export const ConnectionFormat = ({
  format,
  onChange,
}: {
  format: KnackConnectionFieldFormat;
  onChange: (format: KnackConnectionFieldFormat) => void;
}) => {
  const { form, handleChange } = useKnackFieldForm({
    defaultValues: format,
    schema: connectionFormatSchema,
    onChange,
  });

  const { control } = form;

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="allow_multiple"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Allow Multiple</FormLabel>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={(checked) =>
                  handleChange("allow_multiple", checked)
                }
              />
            </FormControl>
            <FormDescription>
              Allow selecting multiple connected records
            </FormDescription>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="enable_search"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Enable Search</FormLabel>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={(checked) =>
                  handleChange("enable_search", checked)
                }
              />
            </FormControl>
            <FormDescription>
              Enable searching for connected records
            </FormDescription>
          </FormItem>
        )}
      />
    </div>
  );
};

/**
 * Input component for connection fields
 */
export const ConnectionInput = forwardRef<
  HTMLInputElement,
  KnackConnectionFieldProps
>(({ value, onChange, format, disabled, onSearch }) => {
  const [open, setOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<KnackConnectionRecord[]>(
    []
  );

  const handleSearch = async (query: string) => {
    if (onSearch) {
      const results = await onSearch(query);
      setSearchResults(results);
    }
  };

  const handleSelect = (record: KnackConnectionRecord) => {
    if (onChange) {
      if (format.allow_multiple) {
        onChange([...value, record]);
      } else {
        onChange([record]);
      }
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value.length > 0
            ? format.display_field
              ? String(value[0][format.display_field])
              : "Selected"
            : "Select record..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput
            placeholder="Search records..."
            onValueChange={handleSearch}
          />
          <CommandEmpty>No records found.</CommandEmpty>
          <CommandGroup>
            {searchResults.map((record) => (
              <CommandItem
                key={record.id}
                value={
                  format.display_field
                    ? String(record[format.display_field])
                    : record.id
                }
                onSelect={() => handleSelect(record)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value.some((v) => v.id === record.id)
                      ? "opacity-100"
                      : "opacity-0"
                  )}
                />
                {format.display_field
                  ? String(record[format.display_field])
                  : record.id}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

ConnectionInput.displayName = "ConnectionInput";
