/**
 * Request and response format types
 */

import type { KnackFilter } from "./filters";

export type KnackResponseFormat = "raw" | "html" | "both";
export type FilterMatch = "and" | "or";
export type DateRangeType = "days" | "weeks" | "months" | "years";

export interface DateRangeFilter {
  field: string;
  operator: "is_during_the_previous" | "is_during_the_next";
  value: string | Date;
  range: number;
  type: DateRangeType;
}

export interface KnackConnectionFilter {
  field: string;
  operator: "is";
  value: string;
}

export interface KnackSceneParameter {
  sceneUrl: string;
  recordId: string;
}

export interface KnackRequestOptions {
  filters?: KnackFilter[];
  filterMatch?: FilterMatch;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  rowsPerPage?: number;
  sceneParameter?: KnackSceneParameter;
  format?: KnackResponseFormat;
}

export type KnackRawField<T> = T & {
  [K in keyof T as `${string & K}_raw`]: T[K];
};

export type KnackRecordWithFormat<
  T,
  F extends KnackResponseFormat
> = F extends "both" ? KnackRawField<T> : T;
