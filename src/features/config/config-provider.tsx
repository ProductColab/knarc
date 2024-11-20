"use client";

import { createContext, useContext, ReactNode, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useConfig } from "./hooks/useConfig";
import { useAvailableConfigs } from "./hooks/useAvailableConfigs";
import { useSchema } from "@/lib/knack/hooks/useSchema";
import { Config } from "./types";
import { Loading } from "@/components/ui/loading";
import { useDuckDB } from "@/lib/duckdb";
import { useMutation } from "@tanstack/react-query";
import { upsertObjects } from "@/app/[configId]/objects/actions";
import { upsertScenes } from "@/app/[configId]/scenes/actions";
import { saveDatabase } from "@/lib/duckdb";

interface ConfigContextValue {
  config: Config | null;
  availableConfigs: Config[];
  isLoading: boolean;
  isError: boolean;
}

export const ConfigContext = createContext<ConfigContextValue | null>(null);

interface ConfigProviderProps {
  children: ReactNode;
}

export default function ConfigProvider({ children }: ConfigProviderProps) {
  const { configId } = useParams<{ configId: string }>();
  const parsedConfigId = configId ? parseInt(configId) : null;
  const syncAttempted = useRef(false);
  const { getConnection } = useDuckDB();

  const {
    data: config,
    isLoading: isLoadingConfig,
    isError: isConfigError,
  } = useConfig(parsedConfigId);

  const {
    data: availableConfigs = [],
    isLoading: isLoadingConfigs,
    isError: isConfigsError,
  } = useAvailableConfigs();

  // Get schema data from Knack
  const {
    data: schema,
    isLoading: isLoadingSchema,
    isError: isSchemaError,
  } = useSchema({
    config,
    enabled: !!config?.id,
  });

  // Schema sync mutation
  const schemaSyncMutation = useMutation({
    mutationFn: async () => {
      if (!schema || !config?.id) {
        throw new Error("Schema or config not available");
      }

      console.log("🔄 Starting schema sync...");
      const conn = await getConnection();

      try {
        // Sync objects and fields
        console.log("📥 Syncing objects and fields...");
        await upsertObjects(conn, config.id, schema.objects);
        console.log("✅ Objects and fields synced");

        // Sync scenes and views
        console.log("📥 Syncing scenes and views...");
        await upsertScenes(conn, config.id, schema.scenes);
        console.log("✅ Scenes and views synced");

        // Save to IndexedDB
        try {
          await saveDatabase();
          console.log("💾 Schema saved to database");
        } catch (error) {
          console.error("Failed to persist schema to IndexedDB:", error);
        }

        console.log("✅ Schema sync complete");
      } catch (error) {
        console.error("Failed to sync schema:", error);
        throw error;
      }
    },
  });

  // Sync schema when config changes
  useEffect(() => {
    async function initializeSchema() {
      if (
        !config?.id ||
        syncAttempted.current ||
        isLoadingConfig ||
        isLoadingConfigs ||
        isLoadingSchema ||
        !schema
      ) {
        return;
      }

      try {
        console.log("🔄 Starting schema initialization...");
        syncAttempted.current = true;
        await schemaSyncMutation.mutateAsync();
      } catch (error) {
        console.error("Failed to initialize schema:", error);
        syncAttempted.current = false;
      }
    }

    initializeSchema();
  }, [
    config?.id,
    isLoadingConfig,
    isLoadingConfigs,
    isLoadingSchema,
    schema,
    schemaSyncMutation,
  ]);

  const isLoading =
    isLoadingConfig ||
    isLoadingConfigs ||
    isLoadingSchema ||
    schemaSyncMutation.isPending;

  const isError =
    isConfigError ||
    isConfigsError ||
    isSchemaError ||
    schemaSyncMutation.isError;

  if (isLoading) {
    return <Loading message="Loading configuration..." />;
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          {schemaSyncMutation.isError
            ? "Failed to sync schema"
            : "Configuration not found"}
        </p>
      </div>
    );
  }

  if (!config && parsedConfigId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Configuration not found</p>
      </div>
    );
  }

  return (
    <ConfigContext.Provider
      value={{
        config: config || null,
        availableConfigs,
        isLoading,
        isError,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export function useActiveConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useActiveConfig must be used within a ConfigProvider");
  }
  return context;
}
