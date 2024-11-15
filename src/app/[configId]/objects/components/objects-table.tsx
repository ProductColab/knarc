"use client";

import { DataTable } from "@/components/ui/data-table";
import type { KnackObject } from "@/lib/knack/types/application";
import { columns } from "./objects-columns";

interface ObjectsTableProps {
  data: KnackObject[];
  loading?: boolean;
}

export function ObjectsTable({ data, loading }: ObjectsTableProps) {
  return (
    <DataTable
      data={data}
      columns={columns}
      loading={loading}
      title="Objects"
      description="A list of all objects in your Knack application."
      searchPlaceholder="Search objects..."
    />
  );
}
