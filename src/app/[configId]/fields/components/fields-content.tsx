"use client";

import { Fields } from "./Fields";
import { useFields } from "@/hooks/useFields";

export function FieldsContent() {
  const { data: fields, error, isLoading } = useFields();

  console.log("🎯 FieldsContent render:", {
    hasFields: !!fields,
    fieldCount: fields?.length,
    hasError: !!error,
    isLoading,
  });

  return (
    <div className="container py-6">
      <Fields fields={fields} error={error ?? undefined} loading={isLoading} />
    </div>
  );
}
