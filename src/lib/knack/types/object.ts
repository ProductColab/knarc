import { KnackField } from "./field";
import { KnackTask } from "./task";

interface KnackInflections {
  singular: string;
  plural: string;
}

interface KnackObjectConnection {
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

interface KnackObjectConnections {
  inbound: KnackObjectConnection[];
  outbound: KnackObjectConnection[];
}

interface KnackObjectSort {
  field: string;
  order: "asc" | "desc";
}

export interface KnackObject {
  _id: string;
  key: string;
  name: string;
  type: string;
  fields: KnackField[];
  inflections: KnackInflections;
  connections: KnackObjectConnections;
  identifier: string;
  schemaChangeInProgress: boolean;
  sort?: KnackObjectSort;
  tasks?: KnackTask[];
  [key: string]: unknown;
}
