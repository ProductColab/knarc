"use client";

import { useEffect, useState } from "react";
import type { RxDatabase } from "rxdb";
import { KnackClient } from "@/lib/knack/api";
import { createDatabase } from "@/lib/store";
import { observeActiveConfig } from "@/lib/store";
import { useRouter } from "next/navigation";
import {
  upsertScenes,
  upsertObjects,
  upsertFields,
  upsertViews,
} from "@/lib/store";
import { KnackContext } from "@/lib/knack/context";

// Declare globalDb variable outside the component
let globalDb: RxDatabase | null = null;

interface KnackProviderProps {
  children: React.ReactNode;
}

export function KnackProvider({ children }: KnackProviderProps) {
  const router = useRouter();
  const [db, setDb] = useState<RxDatabase | null>(null);
  const [client, setClient] = useState<KnackClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize database
  useEffect(() => {
    async function initDb() {
      try {
        if (globalDb) {
          setDb(globalDb);
          setIsInitialized(true);
          return;
        }

        const database = await createDatabase();
        globalDb = database;
        setDb(database);
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize database:", error);
      }
    }

    initDb();

    return () => {
      if (typeof window !== "undefined" && document.hidden) {
        if (globalDb) {
          globalDb.destroy();
          globalDb = null;
        }
      }
    };
  }, []);

  // Watch for active config changes and initialize client
  useEffect(() => {
    if (!db) return;

    const subscription = observeActiveConfig(db).subscribe(
      async (activeConfig) => {
        console.log("🔄 KnackProvider config changed:", {
          activeConfig,
          hasConfig: !!activeConfig,
          applicationId: activeConfig?.applicationId,
        });

        if (activeConfig) {
          try {
            // Create public client with correct domain settings
            const publicClient = new KnackClient(
              {
                applicationId: activeConfig.applicationId,
                apiDomain: activeConfig.apiDomain,
                apiHost: activeConfig.apiHost,
              },
              true
            );

            console.log("📡 Fetching application schema...");
            const schema = await publicClient.getApplication();
            console.log("📥 Received schema:", schema);

            if (schema.scenes) {
              console.log("💾 Storing scenes...");
              await upsertScenes(db, activeConfig.id, schema.scenes);

              console.log("💾 Storing views...", {
                configId: activeConfig.id,
                sceneCount: schema.scenes.length,
              });
              await upsertViews(db, activeConfig.id, schema.scenes);
            }

            if (schema.objects) {
              console.log("💾 Storing objects...");
              await upsertObjects(db, activeConfig.id, schema.objects);

              console.log("💾 Storing fields...", {
                configId: activeConfig.id,
                objectCount: schema.objects.length,
              });
              await upsertFields(db, activeConfig.id, schema.objects);
            }

            // Create authenticated client with same domain settings
            const authenticatedClient = new KnackClient(
              {
                applicationId: activeConfig.applicationId,
                apiKey: activeConfig.apiKey,
                apiDomain: activeConfig.apiDomain,
                apiHost: activeConfig.apiHost,
              },
              false
            );

            setClient(authenticatedClient);
            console.log("✅ Schema stored and client initialized successfully");
          } catch (error) {
            console.error("❌ Failed to fetch/store schema:", error);
            setClient(null);
          }
        } else {
          setClient(null);
          if (isInitialized && router) {
            router.push("/config");
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [db, isInitialized, router]);

  if (!db) {
    return null;
  }

  return (
    <KnackContext.Provider value={{ db, client, isInitialized }}>
      {children}
    </KnackContext.Provider>
  );
}
