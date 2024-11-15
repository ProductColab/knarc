/**
 * Application-level types
 */

import type { KnackInflections, KnackObjectConnections } from "./common";
import type { KnackField } from "./fields";
import type { KnackScene } from "./scenes";

export interface KnackApplicationSchema {
  name: string;
  slug: string;
  home_scene: {
    key: string;
    slug: string;
  };
  id: string;
  objects: KnackObject[];
  scenes: KnackScene[];
  account: KnackAccount;
  logo_url: string;
  [key: string]: unknown;
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
  sort?: {
    field: string;
    order: "asc" | "desc";
  };
  [key: string]: unknown;
}


export interface KnackAccount {
  slug: string;
}
