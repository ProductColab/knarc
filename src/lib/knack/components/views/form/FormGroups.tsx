import type { KnackFormView } from "../../../types";
import { FormInputs } from "./FormInputs";
import { Table, TableHeader, TableRow, TableHead } from "@/components/ui/table";

interface FormGroupsProps {
  groups: KnackFormView["groups"];
}

export function FormGroups({ groups }: FormGroupsProps) {
  if (!groups?.length) return null;

  // Flatten all inputs across groups for consistent striping
  const allInputs = groups.flatMap((group) =>
    group.columns.flatMap((column) => column.inputs)
  );

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-background">
          <TableHead>Field</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Instructions</TableHead>
          <TableHead>Preview</TableHead>
          <TableHead className="w-[52px]">Format</TableHead>
        </TableRow>
      </TableHeader>
      <FormInputs inputs={allInputs} className="even:bg-muted/50" />
    </Table>
  );
}
