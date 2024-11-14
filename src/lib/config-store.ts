import { z } from "zod";

export const configSchema = z.object({
  name: z.string().min(1, "Configuration name is required"),
  applicationId: z.string().min(1, "Application ID is required"),
  apiKey: z.string().min(1, "API Key is required"),
  apiDomain: z.string().default("knack.com"),
  accountSlug: z.string().min(1, "Account slug is required"),
  appSlug: z.string().min(1, "App slug is required"),
  apiPrefix: z.string().default("api"),
  isActive: z.boolean().default(false),
});

export type KnackConfiguration = z.infer<typeof configSchema>;

const STORAGE_KEY = "knack_configs";
const ACTIVE_CONFIG_KEY = "knack_active_config";

export function getConfigurations(): KnackConfiguration[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function getActiveConfiguration(): KnackConfiguration | null {
  const configs = getConfigurations();
  const activeConfigName = localStorage.getItem(ACTIVE_CONFIG_KEY);
  return configs.find((config) => config.name === activeConfigName) ?? null;
}

export function saveConfiguration(config: KnackConfiguration): void {
  const configs = getConfigurations();
  const existingIndex = configs.findIndex((c) => c.name === config.name);

  if (existingIndex >= 0) {
    configs[existingIndex] = config;
  } else {
    configs.push(config);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));

  // If this is the first config or it's marked as active, set it as active
  if (configs.length === 1 || config.isActive) {
    localStorage.setItem(ACTIVE_CONFIG_KEY, config.name);
  }
}

export function setActiveConfiguration(name: string): void {
  const configs = getConfigurations();
  if (configs.some((config) => config.name === name)) {
    localStorage.setItem(ACTIVE_CONFIG_KEY, name);
  }
}

export function deleteConfiguration(name: string): void {
  const configs = getConfigurations().filter((config) => config.name !== name);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));

  // If we deleted the active config, set the first available one as active
  const activeConfig = getActiveConfiguration();
  if (activeConfig?.name === name && configs.length > 0) {
    localStorage.setItem(ACTIVE_CONFIG_KEY, configs[0].name);
  } else if (configs.length === 0) {
    localStorage.removeItem(ACTIVE_CONFIG_KEY);
  }
}
