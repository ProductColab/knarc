import { DataTable } from "@/components/ui/data-table";
import { KnackObject } from "@/lib/knack/types/object";

interface ObjectsTableProps {
  objects: KnackObject[];
}

const ObjectsColumns = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "_id",
    header: "ID",
  },
];

export default function ObjectsTable({ objects }: ObjectsTableProps) {
  return <DataTable columns={ObjectsColumns} data={objects} />;
}
