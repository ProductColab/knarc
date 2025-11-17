import { RuleValue, RuleCriterion } from "../rule";

export interface KnackTaskSchedule {
  repeat: string; // e.g., "daily", "weekly", "monthly"
  timezone_offset?: number;
  timezone_dst?: number;
  startOfIncrement?: boolean;
}

export interface KnackTaskEmailRecipient {
  recipient_mode: string; // e.g., "to", "cc", "bcc"
  recipient_type: string; // e.g., "field", "email"
  email?: string;
  field?: string;
}

export interface KnackTaskEmail {
  from_name?: string;
  from_email?: string;
  subject?: string;
  message?: string;
  recipients?: KnackTaskEmailRecipient[];
}

export interface KnackTaskAction {
  action: "email" | "record" | string;
  criteria?: RuleCriterion[];
  values?: RuleValue[];
  email?: KnackTaskEmail;
  [key: string]: unknown;
}

export interface KnackTask {
  key?: string;
  name: string;
  object_key: string;
  type: string; // e.g., "actions"
  schedule?: KnackTaskSchedule;
  run_status?: string; // e.g., "running", "stopped"
  action: KnackTaskAction;
  scheduled?: boolean;
  [key: string]: unknown;
}

