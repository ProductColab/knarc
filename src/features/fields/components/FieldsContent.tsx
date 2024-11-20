"use client";

import { useState } from "react";
import { useDuckDB } from "@/lib/duckdb";
import { useQuery } from "@tanstack/react-query";
import FieldsTable from "./FieldsTable";
import { FieldDetail } from "./FieldDetail";
import { useActiveConfig } from "@/features/config/config-provider";
import { Loading } from "@/components/ui/loading";
import { FieldWithObject } from "@/lib/knack/types/field";
import { getAllFields } from "../actions";

export default function FieldsContent() {
  const { config } = useActiveConfig();
  const { getConnection } = useDuckDB();
  const [selectedField, setSelectedField] = useState<FieldWithObject | null>(
    null
  );

  const {
    data: fields,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["fields", config?.id],
    queryFn: async () => {
      if (!config?.id) throw new Error("No config ID available");

      console.log("🔍 Fetching fields for config:", config.id);
      const conn = await getConnection();
      const result = await getAllFields(conn, config.id);
      console.log("📊 Found fields:", result.length);
      return result;
    },
    enabled: !!config?.id,
  });

  if (isLoading) {
    return <Loading message="Loading fields..." />;
  }

  if (isError) {
    console.error("Failed to load fields:", error);
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load fields</p>
      </div>
    );
  }

  if (!config?.id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No configuration selected</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Fields</h1>
          <p className="text-sm text-muted-foreground">
            {config.applicationInfo?.name || config.config.applicationId}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {fields?.length || 0} fields found
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-1">
          <FieldsTable
            fields={fields || []}
            onSelectField={setSelectedField}
            selectedField={selectedField}
          />
        </div>
        <div className="md:col-span-1">
          {selectedField && config.id && (
            <FieldDetail field={selectedField} configId={config.id} />
          )}
        </div>
      </div>
    </div>
  );
}
