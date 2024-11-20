/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataTable } from "@/components/ui/data-table";
import { KnackView } from "@/lib/knack/types/view";
import { Badge } from "@/components/ui/badge";

interface ViewWithScene extends KnackView {
  sceneName: string;
  sceneKey: string;
}

interface ViewsTableProps {
  views: ViewWithScene[];
}

const ViewsColumns = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "key",
    header: "Key",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }: { row: any }) => (
      <Badge variant="secondary">{row.original.type.replace(/_/g, " ")}</Badge>
    ),
  },
  {
    accessorKey: "sceneName",
    header: "Scene",
  },
  {
    accessorKey: "title",
    header: "Title",
  },
];

export default function ViewsTable({ views }: ViewsTableProps) {
  return <DataTable columns={ViewsColumns} data={views} />;
}
