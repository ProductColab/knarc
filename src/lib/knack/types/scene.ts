import { KnackObject } from "./object";
import { KnackView } from "./view";

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
  icon?: KnackSceneIcon;
  print?: boolean;
  object?: KnackObject["key"];
}

interface KnackSceneIcon {
  icon: string;
  align: "left" | "right" | "center";
}
