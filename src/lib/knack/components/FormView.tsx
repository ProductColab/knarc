import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import type {
  KnackFormView,
  KnackFormInput,
  KnackFieldFormat,
  KnackMultipleChoiceFormat,
  KnackDateTimeFormat,
} from "../types";

interface FormViewProps {
  view: KnackFormView;
  onSubmit?: (data: unknown) => Promise<void>;
}

export function FormView({ view, onSubmit }: FormViewProps) {
  const [submitting, setSubmitting] = useState(false);

  // Build form schema based on inputs
  const schema = buildFormSchema(view);
  const form = useForm({
    resolver: zodResolver(schema),
  });

  const handleSubmit = async (data: unknown) => {
    if (!onSubmit) return;

    try {
      setSubmitting(true);
      await onSubmit(data);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {view.groups.map((group, groupIndex) => (
          <div key={groupIndex} className="grid gap-6">
            {group.columns.map((column, columnIndex) => (
              <div key={columnIndex} className="grid gap-4">
                {column.inputs.map((input) => (
                  <FormInput key={input.field.key} input={input} form={form} />
                ))}
              </div>
            ))}
          </div>
        ))}

        <Button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : view.submit_button_text}
        </Button>
      </form>
    </Form>
  );
}

interface FormInputProps {
  input: KnackFormInput;
  form: ReturnType<typeof useForm>;
}

function FormInput({ input, form }: FormInputProps) {
  return (
    <FormField
      control={form.control}
      name={input.field.key}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{input.label}</FormLabel>
          <FormControl>{renderInputByType(input, field)}</FormControl>
          {input.instructions && (
            <FormDescription>{input.instructions}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function renderInputByType(input: KnackFormInput, field: any) {
  if (!input.format) return <Input {...field} />;

  switch (input.format.type) {
    case "short_text":
      return <Input {...field} />;

    case "paragraph_text":
      return <Textarea {...field} />;

    case "boolean":
      return (
        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
      );

    case "multiple_choice": {
      const format = input.format.format as KnackMultipleChoiceFormat;
      if (format.type === "single") {
        return (
          <RadioGroup
            onValueChange={field.onChange}
            defaultValue={field.value}
            className="flex flex-col space-y-1"
          >
            {format.options.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={option} />
                <label htmlFor={option}>{option}</label>
              </div>
            ))}
          </RadioGroup>
        );
      }
      return (
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <SelectTrigger>
            <SelectValue placeholder={format.blank || "Select..."} />
          </SelectTrigger>
          <SelectContent>
            {format.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    case "date_time": {
      const format = input.format.format as KnackDateTimeFormat;
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !field.value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {field.value ? (
                format.date_format ? (
                  format(field.value, format.date_format)
                ) : (
                  field.value.toDateString()
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={field.value}
              onSelect={field.onChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      );
    }

    case "currency":
      return (
        <Input
          {...field}
          type="number"
          step="0.01"
          prefix={input.format.format.format}
        />
      );

    case "connection":
      // TODO: Implement connection field with async select
      return (
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="placeholder">Loading...</SelectItem>
          </SelectContent>
        </Select>
      );

    default:
      return <Input {...field} />;
  }
}

function buildFormSchema(view: KnackFormView) {
  const schema: Record<string, z.ZodType> = {};

  view.groups.forEach((group) => {
    group.columns.forEach((column) => {
      column.inputs.forEach((input) => {
        schema[input.field.key] = getSchemaForInput(input);
      });
    });
  });

  return z.object(schema);
}

function getSchemaForInput(input: KnackFormInput): z.ZodType {
  if (!input.format) return z.any();

  const isRequired = input.format.format.required;
  let baseSchema: z.ZodType;

  switch (input.format.type) {
    case "short_text":
    case "paragraph_text":
      baseSchema = z.string();
      break;

    case "boolean":
      baseSchema = z.boolean();
      break;

    case "multiple_choice":
      baseSchema = z.string();
      break;

    case "date_time":
      baseSchema = z.date();
      break;

    case "currency":
      baseSchema = z.number();
      break;

    case "connection":
      baseSchema = z.string();
      break;

    default:
      baseSchema = z.any();
  }

  return isRequired ? baseSchema : baseSchema.optional();
}
