export interface Config {
  id: number;
  config: KnackConfig;
}

export interface ConfigUpdate {
  id?: number;
  config: KnackConfig;
}

export interface KnackConfig {
  applicationId: string;
  apiKey: string;
  apiDomain: string;
  apiHost: string;
  apiVersion: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export type ConfigId = number;
