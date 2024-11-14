"use client";

import { ColumnDef } from "@tanstack/react-table";
import { KnackScene } from "../types";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, ExternalLink } from "lucide-react";

export const columns: ColumnDef<KnackScene>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const scene = row.original;
      return (
        <Link
          href={`/scenes/${scene.key}`}
          className="group flex items-center gap-2 max-w-fit"
        >
          <span className="font-medium text-primary underline-offset-4 group-hover:underline">
            {scene.name}
          </span>
          <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity" />
        </Link>
      );
    },
  },
  {
    accessorKey: "key",
    header: "Key",
    cell: ({ row }) => (
      <code className="px-2 py-1 bg-muted rounded-md text-sm">
        {row.original.key}
      </code>
    ),
  },
  {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) =>
      row.original.slug ? (
        <code className="px-2 py-1 bg-muted rounded-md text-sm">
          {row.original.slug}
        </code>
      ) : null,
  },
  {
    accessorKey: "authenticated",
    header: "Access",
    cell: ({ row }) => {
      const isProtected =
        row.original.authenticated ||
        (row.original.allowed_profiles?.length ?? 0) > 0;
      return (
        <div className="flex items-center gap-2">
          {isProtected ? (
            <>
              <Lock className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary">Protected</Badge>
            </>
          ) : (
            <>
              <Unlock className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline">Public</Badge>
            </>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "views",
    header: "Views",
    cell: ({ row }) => (
      <Badge variant="secondary" className="font-mono">
        {row.original.views?.length ?? 0}
      </Badge>
    ),
  },
];
