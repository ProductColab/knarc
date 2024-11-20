import { useQuery } from "@tanstack/react-query";
import { KnackClient } from "..";
import { KnackObject } from "../types/object";
import { KnackScene } from "../types/scene";
import { Config } from "@/features/config/types";

interface SchemaData {
  objects: KnackObject[];
  scenes: KnackScene[];
  objectCount: number;
  sceneCount: number;
}

interface UseSchemaOptions {
  config: Config | null | undefined;
  enabled?: boolean;
}

export const SCHEMA_QUERY_KEY = ['schema'] as const;

export function useSchema({ config, enabled = true }: UseSchemaOptions) {
  const getSchemaQueryKey = (applicationId: string) => [...SCHEMA_QUERY_KEY, applicationId];

  return useQuery<SchemaData>({
    queryKey: config ? getSchemaQueryKey(config.config.applicationId) : SCHEMA_QUERY_KEY,
    queryFn: async (): Promise<SchemaData> => {
      if (!config) {
        throw new Error('Config is required to fetch schema');
      }

      console.log("📊 Fetching schema for application:", config.config.applicationId);

      const client = new KnackClient(config.config);
      const response = await client.getApplicationSchema();

      const data = {
        objects: response.application.objects,
        scenes: response.application.scenes,
        objectCount: response.application.objects.length,
        sceneCount: response.application.scenes.length
      };

      console.log("📊 Schema response:", {
        objectCount: data.objectCount,
        sceneCount: data.sceneCount
      });

      return data;
    },
    enabled: enabled && !!config?.config.applicationId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
}

// Helper hook to get just the objects
export function useObjects({ config, enabled = true }: UseSchemaOptions) {
  const query = useSchema({ config, enabled });
  return {
    ...query,
    data: query.data?.objects,
  };
}

// Helper hook to get just the scenes
export function useScenes({ config, enabled = true }: UseSchemaOptions) {
  const query = useSchema({ config, enabled });
  return {
    ...query,
    data: query.data?.scenes,
  };
}

// Helper hook to get just the counts
export function useSchemaStats({ config, enabled = true }: UseSchemaOptions) {
  const query = useSchema({ config, enabled });
  return {
    ...query,
    data: query.data ? {
      objectCount: query.data.objectCount,
      sceneCount: query.data.sceneCount
    } : undefined
  };
}
