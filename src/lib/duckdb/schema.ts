export type Config = {
  id: string;
  name: string;
  isActive: boolean;
  applicationId: string;
  apiKey?: string;
  apiDomain?: string;
  apiHost?: string;
  apiVersion?: string;
  accountSlug?: string;
  appSlug?: string;
  builderUrl?: string;
  appUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type Scene = {
  id: string;
  configId: string;
  key: string;
  name: string;
  slug?: string;
  parent?: string;
  views: Record<string, View>;
  authenticated?: boolean;
  updatedAt: string;
};

export type Object = {
  id: string;
  configId: string;
  key: string;
  name: string;
  identifier?: string;
  type: string;
  fields: Record<string, Field>;
  tasks: Record<string, unknown>;
  connections: Record<string, unknown>;
  updatedAt: string;
};

export type Field = {
  id: string;
  configId: string;
  objectKey: string;
  objectName: string;
  key: string;
  name: string;
  type: string;
  required: boolean;
  format?: Record<string, unknown>;
  updatedAt: string;
};

export type View = {
  id: string;
  configId: string;
  sceneKey: string;
  sceneName: string;
  key: string;
  name: string;
  title?: string;
  type: string;
  source: Record<string, unknown>;
  options: Record<string, unknown>;
  updatedAt: string;
};
