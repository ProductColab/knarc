// Base format types
export type KnackBooleanFormat = {
  default: boolean;
  format: "yes_no";
  input: "checkbox";
  required: boolean;
};

export type KnackDateTimeFormat = {
  calendar: boolean;
  date_format: string;
  default_time: string;
  default_type: "none" | string;
  time_format: "Ignore Time" | string;
  time_type: "current" | string;
  default_date: string;
};

export type KnackMultipleChoiceFormat = {
  blank: string;
  default: string;
  options: Array<string | { label: string; value: string }>;
  sorting: "custom" | "alphabetical";
  input_type: "dropdown" | "radios";
};

export type KnackCurrencyFormat = {
  format: "$";
};

export type KnackFileFormat = {
  secure: boolean;
};

export type KnackConnectionFormat = {
  input: "chosen";
  conn_default: "none";
};

export type KnackTextFormat = {
  default: string;
  required: boolean;
  validation: {
    type: "none" | "email" | "url" | "phone" | "rich_text";
    regex?: {
      pattern: string;
      message: string;
    };
  };
};

export type KnackParagraphFormat = {
  default: string;
  required: boolean;
  validation: {
    type: "none" | "rich_text";
    regex?: {
      pattern: string;
      message: string;
    };
  };
};

// Map of input types to their format types
export type KnackFormatMap = {
  boolean: KnackBooleanFormat;
  date_time: KnackDateTimeFormat;
  multiple_choice: KnackMultipleChoiceFormat;
  currency: KnackCurrencyFormat;
  file: KnackFileFormat;
  connection: KnackConnectionFormat;
  short_text: KnackTextFormat;
  paragraph_text: KnackParagraphFormat;
};

// Generic type for field inputs
export type KnackFieldInput<T extends keyof KnackFormatMap> = {
  type: T;
  format: KnackFormatMap[T];
};

// Union type of all possible field inputs
export type KnackField = {
  [K in keyof KnackFormatMap]: KnackFieldInput<K>;
}[keyof KnackFormatMap];

// Form Rule Types
export interface KnackFormRuleCriteria {
  field: string;
  operator: string;
  value: string;
}

export interface KnackFormRuleAction {
  action: "hide-show" | "show-hide" | "show" | "hide";
  field: string;
  value: string;
}

export interface KnackFormRule {
  criteria: KnackFormRuleCriteria[];
  actions: KnackFormRuleAction[];
  key: string;
}

export interface KnackFormRecordRuleValue {
  field: string;
  type: string;
  input: string;
  connection_field: string;
  value: unknown;
}

export interface KnackFormRecordRule {
  action: "record";
  connection: string;
  criteria: KnackFormRuleCriteria[];
  values: KnackFormRecordRuleValue[];
  key: string;
}

export interface KnackFormEmailRecipient {
  recipient_mode: string;
  recipient_type: string;
  email: string;
  field: string;
}

export interface KnackFormEmailRuleValue {
  type: string;
  input: string;
  connection_field: string;
  value: string;
}

export interface KnackFormEmailRule {
  action: "email";
  connection: string;
  criteria: Array<unknown>;
  values: KnackFormEmailRuleValue[];
  email: {
    from_name: string;
    from_email: string;
    subject: string;
    message: string;
    recipients: KnackFormEmailRecipient[];
  };
  key: string;
}

export interface KnackFormSubmitRule {
  key: string;
  action: string;
  message?: string;
  reload_show?: boolean;
  reload_auto?: boolean;
  is_default?: boolean;
}

export interface KnackFormRules {
  submits: KnackFormSubmitRule[];
  fields: KnackFormRule[];
  records: KnackFormRecordRule[];
  emails: KnackFormEmailRule[];
}
