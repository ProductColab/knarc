import { forwardRef } from "react";
import { z } from "zod";
import type { KnackField } from "./types";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useKnackFieldForm } from "../hooks/useKnackFieldForm";
import { format as formatDate } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Types
export interface KnackDateFieldFormat {
  name: string;
  key: string;
  label: string;
  description?: string;
  required?: boolean;
  calendar?: boolean;
  date_format?: string;
  time_format?: string;
  default_time?: string;
  default_type?: "current" | "none";
  time_type?: "current";
  default_date?: string;
  [key: string]: unknown;
}

export type KnackDateFieldValue = Date | null;

export interface KnackDateFieldProps {
  value: KnackDateFieldValue;
  format: KnackDateFieldFormat;
  onChange?: (value: Date | null) => void;
  disabled?: boolean;
}

export type KnackDateField = KnackField<
  "date_time",
  KnackDateFieldFormat,
  KnackDateFieldValue
>;

// Utilities
export function isDateField(field: unknown): field is KnackDateField {
  return (
    typeof field === "object" &&
    field !== null &&
    "type" in field &&
    field.type === "date_time"
  );
}

// Format Configuration Component
const dateTimeFormatSchema = z.object({
  name: z.string(),
  key: z.string(),
  label: z.string(),
  description: z.string().optional(),
  required: z.boolean().optional(),
  calendar: z.boolean().optional(),
  date_format: z.string().optional(),
  time_format: z.string().optional(),
  default_time: z.string().optional(),
  default_type: z.enum(["current", "none"]).optional(),
  time_type: z.enum(["current"]).optional(),
  default_date: z.string().optional(),
});

export const DateTimeFormat = ({
  format,
  onChange,
  field,
}: {
  format: KnackDateFieldFormat;
  onChange: (format: KnackDateFieldFormat) => void;
  field?: KnackDateField;
}) => {
  const { form, handleChange } = useKnackFieldForm<
    "date_time",
    KnackDateFieldFormat
  >({
    defaultValues: format,
    schema: dateTimeFormatSchema,
    onChange,
    field,
  });

  const { control } = form;

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="calendar"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Show Calendar</FormLabel>
            <FormControl>
              <Switch
                checked={field.value as boolean}
                onCheckedChange={(checked) => handleChange("calendar", checked)}
              />
            </FormControl>
            <FormDescription>
              Show calendar picker for date selection
            </FormDescription>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="date_format"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Date Format</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={(field.value as string) || "MM/dd/yyyy"}
                onChange={(e) => handleChange("date_format", e.target.value)}
              />
            </FormControl>
            <FormDescription>
              Format string for date display (e.g., MM/dd/yyyy)
            </FormDescription>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="time_format"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Time Format</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={(field.value as string) || "hh:mm a"}
                onChange={(e) => handleChange("time_format", e.target.value)}
              />
            </FormControl>
            <FormDescription>
              Format string for time display (e.g., hh:mm a)
            </FormDescription>
          </FormItem>
        )}
      />
    </div>
  );
};

// Input Components
const CalendarInput = ({
  value,
  onChange,
  format,
  disabled,
}: KnackDateFieldProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (
            formatDate(value, format.date_format || "MM/dd/yyyy")
          ) : (
            <span>Pick a date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value || undefined}
          onSelect={(date) => onChange?.(date || null)}
          disabled={disabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

CalendarInput.displayName = "CalendarInput";

const DateTimeLocalInput = forwardRef<HTMLInputElement, KnackDateFieldProps>(
  ({ value, onChange, disabled }, ref) => {
    return (
      <Input
        ref={ref}
        type="datetime-local"
        value={value ? value.toISOString().slice(0, 16) : ""}
        onChange={(e) => {
          const date = e.target.value ? new Date(e.target.value) : null;
          onChange?.(date);
        }}
        disabled={disabled}
        className="w-full"
      />
    );
  }
);

DateTimeLocalInput.displayName = "DateTimeLocalInput";

// Main Input Component
export const DateTimeInput = forwardRef<HTMLInputElement, KnackDateFieldProps>(
  (props, ref) => {
    return props.format.calendar ? (
      <CalendarInput {...props} />
    ) : (
      <DateTimeLocalInput {...props} ref={ref} />
    );
  }
);

DateTimeInput.displayName = "DateTimeInput";

// Display Component
export const DateTimeDisplay = ({ value, format }: KnackDateFieldProps) => {
  if (!value) {
    return <div>No date selected</div>;
  }

  const dateString = formatDate(
    value,
    format.date_format || "MM/dd/yyyy hh:mm a"
  );

  return <div>{dateString}</div>;
};

DateTimeDisplay.displayName = "DateTimeDisplay";
