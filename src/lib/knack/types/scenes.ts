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
