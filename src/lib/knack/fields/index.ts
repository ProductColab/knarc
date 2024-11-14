import type { KnackField } from "./types";

export * from "./types";
export * from "./short-text";
export * from "./multiple-choice";
export * from "./date-time";
export * from "./number";
export * from "./boolean";
export * from "./name";
export * from "./email";
export * from "./address";
export * from "./link";
export * from "./file";
export * from "./connection";
export * from "./equation";
export * from "./concatenation";
export * from "./auto-increment";

// Type guard to check if something is a field
export function isField(field: unknown): field is KnackField<string, unknown> {
  return (
    typeof field === "object" &&
    field !== null &&
    "type" in field &&
    "format" in field
  );
}
