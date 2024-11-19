export type SettingsApplicationId = string;

export interface Settings {
  id: SettingsApplicationId;
  config: KnackConfig;
}

export interface KnackConfig {
  applicationId: SettingsApplicationId;
  apiKey: string;
  apiDomain: string;
  apiHost: string;
  apiVersion: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export interface SettingsUpdate {
  id: SettingsApplicationId;
  config: KnackConfig;
}
