import { KnackObject } from "@/lib/knack/types/object";
import { KnackScene } from "@/lib/knack/types/scene";
import type { NodeRef } from "@/lib/deps/types";
import type { Node } from "@xyflow/react";

export interface KnackConfig {
  applicationId: string;
  apiKey: string;
  apiDomain: string;
  apiHost: string;
  apiVersion: string;
}

export interface ApplicationInfo {
  name: string;
  slug: string;
  logoUrl: string;
  objects: KnackObject[];
  scenes: KnackScene[];
  account: {
    slug: string;
    name: string;
  };
}

export interface ApplicationMetadata {
  name: string;
  slug: string;
  logoUrl: string;
  account: {
    slug: string;
    name: string;
  };
}

export interface Config {
  id?: number;
  config: KnackConfig;
  applicationInfo?: ApplicationMetadata;
}

export type ConfigSubmitHandler = (config: Config) => Promise<number>;

export interface ConfigUpdate {
  id?: number;
  config: KnackConfig;
  applicationInfo?: ApplicationMetadata;
}

// ReactFlow node typing for the app
export type AppNodeType = "entity" | "groupNode" | "ripple";

// Domain-level entity kinds used for NodeRef typing and grouping
export type EntityKind = "object" | "field" | "view" | "scene";

export type EntityNodeData = {
  label: string;
  node?: NodeRef;
  entityKind?: EntityKind;
};

export type GroupNodeData = {
  title: string;
  count: number;
  root: NodeRef;
  groupType: EntityKind;
};

export type AppNodeData = EntityNodeData | GroupNodeData;

export type RippleNodeData = {
  label: string;
  score: number;
  entityKind: EntityKind;
  isRoot?: boolean;
};

export type AppNode =
  | Node<AppNodeData>
  | Node<GroupNodeData>
  | Node<RippleNodeData>;
