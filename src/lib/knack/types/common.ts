/**
 * Common types used across multiple files
 */

export interface KnackInflections {
  singular: string;
  plural: string;
}

export interface KnackObjectConnection {
  object: string;
  key: string;
  name: string;
  field: {
    name: string;
    inflections: KnackInflections;
  };
  has: "one" | "many";
  belongs_to: "one" | "many";
}

export interface KnackObjectConnections {
  inbound: KnackObjectConnection[];
  outbound: KnackObjectConnection[];
}
