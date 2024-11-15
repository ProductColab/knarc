"use client";

import { ColumnDef } from "@tanstack/react-table";
import { KnackObject } from "@/lib/knack/types/application";
import { Badge } from "@/components/ui/badge";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { KnackField } from "@/lib/knack/types/fields";

function ConnectionsBadges({
  inbound,
  outbound,
}: {
  inbound: number;
  outbound: number;
}) {
  const total = inbound + outbound;

  if (total === 0) {
    return <Badge variant="outline">None</Badge>;
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="flex items-center gap-1.5">
        <ArrowDownToLine
          className={cn("h-3 w-3", inbound === 0 && "text-muted-foreground")}
        />
        {inbound}
      </Badge>
      <Badge variant="secondary" className="flex items-center gap-1.5">
        <ArrowUpFromLine
          className={cn("h-3 w-3", outbound === 0 && "text-muted-foreground")}
        />
        {outbound}
      </Badge>
    </div>
  );
}

function IdentifierDisplay({ field }: { field?: KnackField }) {
  if (!field) {
    return <span className="text-muted-foreground">No identifier</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{field.name}</span>
      <code className="text-xs bg-muted px-1 py-0.5 rounded">{field.key}</code>
    </div>
  );
}

export const columns: ColumnDef<KnackObject>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="font-medium">
        <div className="flex items-center gap-2">{row.original.name}</div>
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
    accessorKey: "identifier",
    header: "Identifier",
    cell: ({ row }) => {
      const identifierField = row.original.fields.find(
        (field) => field.key === row.original.identifier
      );
      return <IdentifierDisplay field={identifierField} />;
    },
  },
  {
    accessorKey: "fields",
    header: "Fields",
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.fields.length}</Badge>
    ),
  },
  {
    accessorKey: "connections",
    header: "Connections",
    cell: ({ row }) => (
      <ConnectionsBadges
        inbound={row.original.connections.inbound.length}
        outbound={row.original.connections.outbound.length}
      />
    ),
  },
];
