import type { KnackView } from "./views";

/**
 * Scene types and related interfaces
 */

export interface KnackScene {
  _id: string;
  key: string;
  name: string;
  slug: string;
  parent?: string;
  views: KnackView[];
  groups?: Array<{
    columns: Array<{
      width?: number;
      keys?: string[];
    }>;
  }>;
  modal?: boolean;
  modal_prevent_background_click_close?: boolean;
  allowed_profiles?: string[];
  print?: boolean;
  object?: string;
  icon?: {
    icon: string;
    align: "left" | "right" | "center";
  };
  authenticated?: boolean;
}
