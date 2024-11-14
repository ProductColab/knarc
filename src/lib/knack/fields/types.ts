/**
 * Base types for all field formats
 */

export interface KnackFieldBase {
  name: string;
  key: string;
  label: string;
  description?: string;
  required?: boolean;
  unique?: boolean;
  conditional?: boolean;
  user?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rules?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validation?: any[];
}

export interface KnackField<T extends string, F, V = KnackFieldValue>
  extends KnackFieldBase {
  type: T;
  format: F;
  value?: V;
}

export type KnackFieldValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined;
