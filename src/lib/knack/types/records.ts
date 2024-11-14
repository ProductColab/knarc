/**
 * Record types and related interfaces
 */

import type { KnackFieldValue } from "./values";

export interface KnackRecord {
  id: string;
  [key: string]: KnackFieldValue | string;
}

export interface KnackRecordInput {
  id?: string;
  [key: string]: KnackFieldValue | undefined;
}

export interface KnackResponse<T> {
  records: T[];
  total_pages?: number;
  total_records?: number;
  current_page?: number;
}
