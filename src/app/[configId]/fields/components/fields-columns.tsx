"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { EnhancedKnackField } from "@/hooks/useFields";

export const columns: ColumnDef<EnhancedKnackField>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="font-medium">
        <div className="flex items-center gap-2">
          {row.original.name}
          {row.original.required && (
            <Badge variant="destructive" className="text-xs">
              Required
            </Badge>
          )}
        </div>
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
    accessorKey: "objectName",
    header: "Object",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <span>{row.original.objectName}</span>
        <code className="text-xs bg-muted px-1 py-0.5 rounded">
          {row.original.objectKey}
        </code>
      </div>
    ),
  },
  {
    accessorKey: "format",
    header: "Format",
    cell: ({ row }) => (
      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
        {JSON.stringify(row.original.format, null, 2)}
      </pre>
    ),
  },
];
