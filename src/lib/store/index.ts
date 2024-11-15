import { createRxDatabase, addRxPlugin, RxDatabase, RxDocument } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin, disableWarnings } from 'rxdb/plugins/dev-mode';
import type { KnackApplicationSchema } from '../knack/types/application';
import type { KnackConfig } from '../knack/types/config';
import type { KnackScene } from "@/lib/knack/types/scenes";
import type { KnackObject } from "@/lib/knack/types/application";

// Document types
export interface ConfigDocType extends KnackConfig {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export type ConfigDocument = RxDocument<ConfigDocType>;

// Enable dev-mode plugin
addRxPlugin(RxDBDevModePlugin);
disableWarnings();

// Schema Definitions
const configSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string', maxLength: 100 },
    isActive: { type: 'boolean' },
    applicationId: { type: 'string', maxLength: 100 },
    apiKey: { type: 'string', maxLength: 100, optional: true },
    apiDomain: { type: 'string', maxLength: 100, optional: true },
    apiHost: { type: 'string', maxLength: 100, optional: true },
    apiVersion: { type: 'string', maxLength: 10, optional: true },
    accountSlug: { type: 'string', maxLength: 100, optional: true },
    appSlug: { type: 'string', maxLength: 100, optional: true },
    builderUrl: { type: 'string', maxLength: 200, optional: true },
    appUrl: { type: 'string', maxLength: 200, optional: true },
    createdAt: { type: 'number', multipleOf: 1 },
    updatedAt: { type: 'number', multipleOf: 1 }
  },
  required: ['id', 'name', 'applicationId', 'isActive', 'createdAt', 'updatedAt'],
  indexes: ['isActive']
};

const sceneSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    configId: { type: 'string', maxLength: 100 },
    key: { type: 'string', maxLength: 100 },
    name: { type: 'string', maxLength: 100 },
    slug: { type: 'string', maxLength: 100 },
    parent: { type: 'string', maxLength: 100 },
    views: { type: 'array' },
    authenticated: { type: 'boolean' },
    updatedAt: { type: 'number', multipleOf: 1 }
  },
  required: ['id', 'configId', 'key', 'name', 'updatedAt'],
  indexes: ['configId', 'key']
};

const objectSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    configId: { type: 'string', maxLength: 100 },
    key: { type: 'string', maxLength: 100 },
    name: { type: 'string', maxLength: 100 },
    identifier: { type: 'string', maxLength: 100 },
    type: { type: 'string', maxLength: 100 },
    fields: { type: 'array' },
    tasks: { type: 'array' },
    connections: { type: 'array' },
    updatedAt: { type: 'number', multipleOf: 1 }
  },
  required: ['id', 'configId', 'key', 'name', 'type', 'updatedAt'],
  indexes: ['configId', 'key']
};

const fieldSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    configId: { type: 'string', maxLength: 100 },
    objectKey: { type: 'string', maxLength: 100 },
    objectName: { type: 'string', maxLength: 100 },
    key: { type: 'string', maxLength: 100 },
    name: { type: 'string', maxLength: 100 },
    type: { type: 'string', maxLength: 100 },
    required: { type: 'boolean' },
    format: { type: 'object' },
    updatedAt: { type: 'number', multipleOf: 1 }
  },
  required: ['id', 'configId', 'objectKey', 'key', 'name', 'type', 'updatedAt'],
  indexes: ['configId', 'objectKey', 'key']
};

const viewSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    configId: { type: 'string', maxLength: 100 },
    sceneKey: { type: 'string', maxLength: 100 },
    sceneName: { type: 'string', maxLength: 100 },
    key: { type: 'string', maxLength: 100 },
    name: { type: 'string', maxLength: 100 },
    title: { type: 'string', maxLength: 200 },
    type: { type: 'string', maxLength: 100 },
    source: { type: 'object' },
    options: { type: 'object' },
    updatedAt: { type: 'number', multipleOf: 1 }
  },
  required: ['id', 'configId', 'sceneKey', 'key', 'type', 'updatedAt'],
  indexes: ['configId', 'sceneKey', 'key']
};

// Export types
export type ConfigSchema = typeof configSchema;
export type StoredKnackConfig = ConfigDocument;

// Database initialization
export const createDatabase = async () => {
  const db = await createRxDatabase({
    name: 'knackexplorer',
    storage: getRxStorageDexie(),
  });

  console.log("🏗️ Creating database collections...");
  await db.addCollections({
    configs: {
      schema: configSchema,
    },
    scenes: {
      schema: sceneSchema,
    },
    objects: {
      schema: objectSchema,
    },
    fields: {
      schema: fieldSchema,
    },
    views: {
      schema: viewSchema,
    },
  });

  console.log("✅ Database collections created:", Object.keys(db.collections));
  return db;
};

// Config Collection Methods
export const getConfigs = async (db: RxDatabase) => {
  return await db.configs.find().exec();
};

export const getActiveConfig = async (db: RxDatabase) => {
  return await db.configs.findOne({
    selector: { isActive: true }
  }).exec();
};

export const setActiveConfig = async (db: RxDatabase, configId: string) => {
  const [currentActive, targetConfig] = await Promise.all([
    db.configs.findOne({ selector: { isActive: true } }).exec(),
    db.configs.findOne({ selector: { id: configId } }).exec()
  ]);

  if (!targetConfig) {
    throw new Error('Config not found');
  }

  if (targetConfig.get('isActive')) {
    return targetConfig;
  }

  const updates = [];

  if (currentActive) {
    updates.push({
      previous: currentActive.toJSON(),
      document: {
        ...currentActive.toJSON(),
        isActive: false
      }
    });
  }

  updates.push({
    previous: targetConfig.toJSON(),
    document: {
      ...targetConfig.toJSON(),
      isActive: true
    }
  });

  await db.configs.bulkUpsert(updates);

  return targetConfig;
};

export const insertConfig = async (
  db: RxDatabase,
  config: Omit<ConfigDocType, 'id' | 'createdAt' | 'updatedAt'>
) => {
  const timestamp = Date.now();
  return await db.configs.insert({
    ...config,
    id: crypto.randomUUID(),
    createdAt: timestamp,
    updatedAt: timestamp
  });
};

export const updateConfig = async (
  db: RxDatabase,
  configId: string,
  update: Partial<ConfigDocType>
) => {
  const doc = await db.configs.findOne({
    selector: { id: configId }
  }).exec();

  if (!doc) {
    throw new Error('Config not found');
  }

  await doc.patch({
    ...update,
    updatedAt: Date.now()
  });

  return doc;
};

// Application Collection Methods
export const getApplication = async (db: RxDatabase, applicationId: string) => {
  return await db.applications.findOne({
    selector: { id: applicationId }
  }).exec();
};

export const upsertApplication = async (
  db: RxDatabase,
  application: KnackApplicationSchema,
  configId: string
) => {
  const timestamp = Date.now();
  return await db.applications.upsert({
    ...application,
    id: application.id,
    configId,
    updatedAt: timestamp
  });
};

// Reactive Queries
export const observeConfigs = (db: RxDatabase) => {
  return db.configs.find().$;
};

export const observeActiveConfig = (db: RxDatabase) => {
  return db.configs.findOne({
    selector: { isActive: true }
  }).$;
};

export const observeApplication = (db: RxDatabase, applicationId: string) => {
  return db.applications.findOne({
    selector: { id: applicationId }
  }).$;
};

// Scene Collection Methods
export const getScenes = async (db: RxDatabase, configId: string) => {
  console.log("📚 Getting scenes from DB for configId:", configId);
  const scenes = await db.scenes.find({
    selector: { configId },
    sort: [{ name: 'asc' }]
  }).exec();
  console.log(`📋 Found ${scenes.length} scenes in DB`);
  return scenes;
};

export const upsertScenes = async (
  db: RxDatabase,
  configId: string,
  scenes: KnackScene[]
) => {
  console.log(`📝 Upserting ${scenes.length} scenes for configId:`, configId);
  const timestamp = Date.now();
  const updates = scenes.map(scene => ({
    id: `${configId}_${scene.key}`,
    configId,
    ...scene,
    updatedAt: timestamp
  }));

  await db.scenes.bulkUpsert(updates);
  console.log("✅ Scenes upsert complete");
  return updates;
};

// Object Collection Methods
export const getObjects = async (db: RxDatabase, configId: string) => {
  return await db.objects.find({
    selector: { configId },
    sort: [{ name: 'asc' }]
  }).exec();
};

export const upsertObjects = async (
  db: RxDatabase,
  configId: string,
  objects: KnackObject[]
) => {
  const timestamp = Date.now();
  const updates = objects.map(object => ({
    id: `${configId}_${object.key}`,
    configId,
    ...object,
    updatedAt: timestamp
  }));

  await db.objects.bulkUpsert(updates);
  return updates;
};

// Field Collection Methods
export const getFields = async (db: RxDatabase, configId: string) => {
  console.log("🔍 Getting fields from DB for configId:", configId);
  console.log("📚 Available collections:", Object.keys(db.collections));

  const fields = await db.fields.find({
    selector: { configId },
    sort: [{ objectName: 'asc', name: 'asc' }]
  }).exec();

  console.log(`📋 Found ${fields.length} fields in DB`);
  console.log("🔍 Query selector used:", { configId });
  console.log("🔍 Sample field from DB:", fields[0]?.toJSON());

  // Let's also check if we can find any fields at all
  const totalFields = await db.fields.find().exec();
  console.log(`📊 Total fields in collection: ${totalFields.length}`);

  return fields;
};

export const upsertFields = async (
  db: RxDatabase,
  configId: string,
  objects: KnackObject[]
) => {
  console.log("🔄 Starting fields upsert for configId:", configId);
  console.log("📊 Objects count:", objects.length);

  const timestamp = Date.now();
  const updates = objects.flatMap(object => {
    console.log(`📑 Processing fields for object ${object.name} (${object.key}):`, object.fields.length);
    return object.fields.map(field => ({
      id: `${configId}_${object.key}_${field.key}`,
      configId,
      objectKey: object.key,
      objectName: object.name,
      ...field,
      updatedAt: timestamp
    }));
  });

  console.log("📝 Total fields to upsert:", updates.length);
  console.log("🔍 Sample field:", updates[0]);

  await db.fields.bulkUpsert(updates);
  console.log("✅ Fields upsert complete");
  return updates;
};

// View Collection Methods
export const getViews = async (db: RxDatabase, configId: string) => {
  console.log("🔍 Getting views from DB for configId:", configId);
  const views = await db.views.find({
    selector: { configId },
    sort: [{ sceneName: 'asc', name: 'asc' }]
  }).exec();
  console.log(`📋 Found ${views.length} views in DB`);
  return views;
};

export const upsertViews = async (
  db: RxDatabase,
  configId: string,
  scenes: KnackScene[]
) => {
  console.log("🔄 Starting views upsert for configId:", configId);
  console.log("📊 Scenes count:", scenes.length);

  const timestamp = Date.now();
  const updates = scenes.flatMap(scene => {
    console.log(`📑 Processing views for scene ${scene.name} (${scene.key}):`, scene.views?.length ?? 0);
    return (scene.views ?? []).map(view => ({
      id: `${configId}_${scene.key}_${view.key}`,
      configId,
      sceneKey: scene.key,
      sceneName: scene.name,
      ...view,
      updatedAt: timestamp
    }));
  });

  console.log("📝 Total views to upsert:", updates.length);
  await db.views.bulkUpsert(updates);
  console.log("✅ Views upsert complete");
  return updates;
};

// Cleanup Function
export const cleanupConfigData = async (db: RxDatabase, configId: string) => {
  await Promise.all([
    db.scenes.find({ selector: { configId } }).remove(),
    db.objects.find({ selector: { configId } }).remove(),
    db.fields.find({ selector: { configId } }).remove(),
    db.views.find({ selector: { configId } }).remove()
  ]);
};
