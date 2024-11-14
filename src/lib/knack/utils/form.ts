import type { KnackFormatMap, KnackFieldType } from "../types/fields";

const createDefaultFormat: {
  [K in KnackFieldType]: () => KnackFormatMap[K];
} = {
  boolean: () => ({
    default: false,
    format: "yes_no",
    input: "checkbox",
    required: false,
  }),

  date_time: () => ({
    calendar: false,
    date_format: "mm/dd/yyyy",
    default_time: "",
    default_type: "none",
    time_format: "Ignore Time",
    time_type: "current",
    default_date: "",
  }),

  multiple_choice: () => ({
    blank: "Select...",
    default: "kn-blank",
    options: [],
    sorting: "custom",
    input_type: "radios",
  }),

  currency: () => ({
    format: "$",
  }),

  file: () => ({
    secure: false,
  }),

  connection: () => ({
    input: "chosen",
    conn_default: "none",
  }),

  short_text: () => ({
    default: "",
    required: false,
    validation: {
      type: "none",
    },
  }),

  paragraph_text: () => ({
    default: "",
    required: false,
    validation: {
      type: "none",
    },
  }),
};

// Helper to safely extract format from a field input
export function getFieldFormat<T extends KnackFieldType>(
  type: T,
  format?: unknown
): KnackFormatMap[T] {
  const defaultFormat = createDefaultFormat[type]();

  if (!format || typeof format !== "object") {
    return defaultFormat;
  }

  const typedFormat = format as Partial<KnackFormatMap[T]>;

  return {
    ...defaultFormat,
    ...typedFormat,
  };
}
