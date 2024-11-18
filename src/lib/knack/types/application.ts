import { KnackObject } from "./object";

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


export interface KnackScene {
  _id: string;
  key: string;
  name: string;
  slug: string;
  parent?: string;
  views: KnackView[];
  authenticated?: boolean;
  allowed_profiles?: string[];
  modal?: boolean;
  modal_prevent_background_click_close?: boolean;
  icon?: {
    icon: string;
    align: 'left' | 'right' | 'center';
  };
  print?: boolean;
  object?: string;
}
