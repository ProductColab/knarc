import { DataTable } from "@/components/ui/data-table";
import { KnackScene } from "@/lib/knack/types/scene";

interface ScenesTableProps {
  scenes: KnackScene[];
}

const ScenesColumns = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "_id",
    header: "ID",
  },
  {
    accessorKey: "slug",
    header: "Slug",
  },
];

export default function ScenesTable({ scenes }: ScenesTableProps) {
  return <DataTable columns={ScenesColumns} data={scenes} />;
}
