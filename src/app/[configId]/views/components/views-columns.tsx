"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { EnhancedKnackView } from "@/hooks/useViews";

export const columns: ColumnDef<EnhancedKnackView>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.title || row.original.name || "Untitled View"}
      </div>
    ),
  },
  {
    accessorKey: "key",
    header: "Key",
    cell: ({ row }) => (
      <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
        {row.original.key}
      </code>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
  },
  {
    accessorKey: "sceneName",
    header: "Scene",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <span>{row.original.sceneName}</span>
        <code className="text-xs bg-muted px-1 py-0.5 rounded">
          {row.original.sceneKey}
        </code>
      </div>
    ),
  },
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => (
      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
        {JSON.stringify(row.original.source, null, 2)}
      </pre>
    ),
  },
];
