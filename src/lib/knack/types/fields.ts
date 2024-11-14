/**
 * Field types and related interfaces
 */

import type { KnackBooleanFieldFormat } from "../fields/boolean";
import type { KnackDateFieldFormat } from "../fields/date-time";
import type { KnackMultipleChoiceFieldFormat } from "../fields/multiple-choice";
import type { KnackFileFieldFormat } from "../fields/file";
import type { KnackConnectionFieldFormat } from "../fields/connection";
import type { KnackTextFieldFormat } from "../fields/short-text";
import type { KnackField as KnackFieldBase } from "../fields/types";
import type { KnackNumberFieldFormat } from "../fields/number";
import type { KnackEmailFieldFormat } from "../fields/email";
import type { KnackLinkFieldFormat } from "../fields/link";
import type { KnackNameFieldFormat } from "../fields/name";

// Format Map Type
export type KnackFormatMap = {
  boolean: KnackBooleanFieldFormat;
  date_time: KnackDateFieldFormat;
  multiple_choice: KnackMultipleChoiceFieldFormat;
  file: KnackFileFieldFormat;
  connection: KnackConnectionFieldFormat;
  short_text: KnackTextFieldFormat;
  number: KnackNumberFieldFormat;
  email: KnackEmailFieldFormat;
  link: KnackLinkFieldFormat;
  name: KnackNameFieldFormat;
};

// Field Types
export type KnackField = {
  [K in keyof KnackFormatMap]: KnackFieldBase<K, KnackFormatMap[K]>;
}[keyof KnackFormatMap];

export type KnackFieldFormat = KnackField["format"];
export type KnackFieldType = keyof KnackFormatMap;
