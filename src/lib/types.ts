import { KnackObject } from "@/lib/knack/types/object";
import { KnackScene } from "@/lib/knack/types/scene";

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
