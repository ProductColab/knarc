import { KnackObject } from "./object";
import { KnackScene } from "./scene";

export interface KnackAccount {
  slug: string;
}

export interface KnackApplication {
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
