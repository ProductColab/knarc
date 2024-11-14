/**
 * Authentication types and interfaces
 */

export interface KnackUserProfile {
  entry_id: string;
  object: string;
}

export interface KnackUserSession {
  user: {
    approval_status: "approved" | "pending";
    empty_pass: boolean;
    id: string;
    profile_keys: string[];
    profile_objects: KnackUserProfile[];
    token: string;
    utility_key: string;
    values: Record<string, unknown>;
  };
}

export interface KnackLoginResponse {
  session: KnackUserSession;
}

export interface KnackLoginCredentials {
  email: string;
  password: string;
}
