"use client";

import { DataTable } from "@/components/ui/data-table";
import type { KnackScene } from "@/lib/knack/types";
import { columns } from "./scenes-columns";

interface ScenesTableProps {
  data: KnackScene[];
  loading?: boolean;
}

export function ScenesTable({ data, loading }: ScenesTableProps) {
  return (
    <DataTable
      data={data}
      columns={columns}
      loading={loading}
      title="Scenes"
      description="A list of all scenes in your Knack application."
      searchPlaceholder="Search scenes by name, key, or slug..."
    />
  );
}
