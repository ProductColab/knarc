import { KnackObject } from "./object";
import { KnackScene } from "./scene";

export interface KnackAccount {
  slug: string;
  name: string;
}

export interface KnackApplication {
  id: string;
  name: string;
  slug: string;
  objects: KnackObject[];
  scenes: KnackScene[];
  home_scene: {
    key: string;
    slug: string;
  };
  account: KnackAccount;
  logo_url: string;
  [key: string]: unknown;
}
