import { FieldsTable } from "./fields-table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { EnhancedKnackField } from "@/hooks/useFields";

interface FieldsProps {
  fields?: EnhancedKnackField[];
  error?: Error;
  loading?: boolean;
}

export function Fields({ fields, error, loading }: FieldsProps) {
  console.log("🔍 Fields component render:", {
    hasFields: !!fields,
    fieldCount: fields?.length,
    hasError: !!error,
    isLoading: loading,
  });

  if (error) {
    console.error("❌ Fields component error:", error);
    return (
      <Card className="bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive">
            Error Loading Fields
          </CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (fields?.length === 0 && !loading) {
    console.warn("⚠️ No fields found in data");
  }

  console.log("📊 Passing to FieldsTable:", {
    fieldCount: fields?.length,
    sampleField: fields?.[0],
  });

  return <FieldsTable data={fields ?? []} loading={loading} />;
}
