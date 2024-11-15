"use client";

import { DataTable } from "@/components/ui/data-table";
import type { EnhancedKnackView } from "@/hooks/useViews";
import { columns } from "./views-columns";

interface ViewsTableProps {
  data: EnhancedKnackView[];
  loading?: boolean;
}

export function ViewsTable({ data, loading }: ViewsTableProps) {
  return (
    <DataTable
      data={data}
      columns={columns}
      loading={loading}
      title="Views"
      description="A list of all views across all scenes in your Knack application."
      searchPlaceholder="Search views by title, key, or type..."
    />
  );
}
