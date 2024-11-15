"use client";

import { DataTable } from "@/components/ui/data-table";
import type { EnhancedKnackField } from "@/hooks/useFields";
import { columns } from "./fields-columns";

interface FieldsTableProps {
  data: EnhancedKnackField[];
  loading?: boolean;
}

export function FieldsTable({ data, loading }: FieldsTableProps) {
  return (
    <DataTable
      data={data}
      columns={columns}
      loading={loading}
      title="Fields"
      description="A list of all fields across all objects in your Knack application."
      searchPlaceholder="Search fields by name, key, or type..."
    />
  );
}
