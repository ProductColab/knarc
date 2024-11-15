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
    <div className="glass-border rounded-md">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-muted/5 border-b border-white/10">
            <TableHead className="text-glow-white">Field</TableHead>
            <TableHead className="text-glow-white">Type</TableHead>
            <TableHead className="text-glow-white">Instructions</TableHead>
            <TableHead className="text-glow-white">Preview</TableHead>
            <TableHead className="w-[52px] text-glow-white">Format</TableHead>
          </TableRow>
        </TableHeader>
        <FormInputs inputs={allInputs} className="even:bg-muted/5" />
      </Table>
    </div>
  );
}
