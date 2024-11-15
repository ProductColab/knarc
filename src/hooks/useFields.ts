"use client";

import { useKnack } from "@/lib/knack/context";
import { useQuery } from "@tanstack/react-query";
import { getFields } from "@/lib/store";
import type { KnackField } from "@/lib/knack/types/fields";
import { useConfig } from "./useConfig";

export interface EnhancedKnackField extends Omit<KnackField, "type"> {
  type: string;
  objectName: string;
  objectKey: string;
  format: Record<string, unknown>;
}

export function useFields() {
  const { db, client } = useKnack();
  const { activeConfig } = useConfig();

  return useQuery({
    queryKey: ["fields", activeConfig?.id],
    queryFn: async () => {
      if (!client || !activeConfig) {
        console.warn("⚠️ No active client or config in useFields");
        return [];
      }

      console.log("🔍 Fetching fields for config:", {
        configId: activeConfig.id,
        applicationId: client.getApplicationId()
      });

      const fields = await getFields(db, activeConfig.id);
      console.log(`📊 Retrieved ${fields.length} fields from DB`);

      if (fields.length === 0) {
        console.warn("⚠️ No fields found in database for config:", activeConfig.id);
      }

      return fields as EnhancedKnackField[];
    },
    enabled: !!client && !!activeConfig,
  });
} 