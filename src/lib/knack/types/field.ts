export type SHORT_TEXT = "short_text";
export type PARAGRAPH_TEXT = "paragraph_text";
export type NUMBER = "number";
export type CURRENCY = "currency";
export type DATE = "date_time";
export type BOOLEAN = "boolean";
export type EMAIL = "email";
export type PHONE = "phone";
export type URL = "link";
export type IMAGE = "image";
export type FILE = "file";
export type NAME = "name";
export type ADDRESS = "address";
export type CONNECTION = "connection";
export type SELECT = "multiple_choice";

export type KnackFieldType =
  | SHORT_TEXT
  | PARAGRAPH_TEXT
  | NUMBER
  | CURRENCY
  | DATE
  | BOOLEAN
  | EMAIL
  | PHONE
  | URL
  | IMAGE
  | FILE
  | NAME
  | ADDRESS
  | CONNECTION
  | SELECT

export interface KnackField {
  key: string;
  name: string;
  type: KnackFieldType;
  description: string;
  required: boolean;
  conditional: boolean;
  rules: unknown;
  validation: unknown;
  [key: string]: unknown;
}
