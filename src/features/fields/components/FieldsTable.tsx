/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataTable } from "@/components/ui/data-table";
import { FieldWithObject } from "@/lib/knack/types/field";
import { Badge } from "@/components/ui/badge";
import { Dispatch, SetStateAction } from "react";

interface FieldsTableProps {
  fields: FieldWithObject[];
  onSelectField: Dispatch<SetStateAction<FieldWithObject | null>>;
  selectedField: FieldWithObject | null;
}

const FieldsColumns = [
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
    accessorKey: "objectName",
    header: "Object",
  },
  {
    accessorKey: "required",
    header: "Required",
    cell: ({ row }: { row: any }) => (
      <Badge variant={row.original.required ? "default" : "outline"}>
        {row.original.required ? "Yes" : "No"}
      </Badge>
    ),
  },
];

export default function FieldsTable({
  fields,
  onSelectField,
  selectedField,
}: FieldsTableProps) {
  return (
    <DataTable
      columns={FieldsColumns}
      data={fields}
      onRowClick={(row) => onSelectField(row.original)}
      selectedRow={selectedField}
    />
  );
}
