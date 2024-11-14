/**
 * Filter types and related interfaces
 */

export type CommonOperators = "is_blank" | "is_not_blank";

export type TextOperators =
  | "contains"
  | "does_not_contain"
  | "is"
  | "is_not"
  | "starts_with"
  | "ends_with"
  | CommonOperators;

export type BooleanOperators = "is" | "is_not" | CommonOperators;

export type MultipleChoiceOperators =
  | "is"
  | "is_not"
  | "contains"
  | "does_not_contain"
  | "is_any"
  | CommonOperators;

export type DateTimeOperators =
  | "is"
  | "is_not"
  | `is_during_the_${"current" | "previous" | "next"}`
  | `is_${"before" | "after"}_the_${"previous" | "next"}`
  | "is_before"
  | "is_after"
  | "is_today"
  | `is_today_or_${"before" | "after"}`
  | `is_${"before" | "after"}_today`
  | `is_${"before" | "after"}_current_time`
  | CommonOperators;

export type NumberOperators =
  | "is"
  | "is_not"
  | "higher_than"
  | "lower_than"
  | CommonOperators;

export type AddressOperators =
  | "contains"
  | "does_not_contain"
  | "is"
  | "is_not"
  | "starts_with"
  | "ends_with"
  | "near"
  | CommonOperators;

export type BinaryFieldOperators = CommonOperators;

export interface KnackFilterBase<T, O> {
  field: string;
  operator: O;
  value: T;
}

export type KnackFilter =
  | KnackFilterBase<string, TextOperators>
  | KnackFilterBase<boolean, BooleanOperators>
  | KnackFilterBase<string | string[], MultipleChoiceOperators>
  | KnackFilterBase<string | Date, DateTimeOperators>
  | KnackFilterBase<number, NumberOperators>
  | KnackFilterBase<string, AddressOperators>
  | KnackFilterBase<never, BinaryFieldOperators>;
