import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApplication } from "../hooks/useApplication";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "./ErrorBoundary";
import type { KnackField } from "../types";

export function Fields() {
  return (
    <ErrorBoundary>
      <FieldsContent />
    </ErrorBoundary>
  );
}

function FieldsContent() {
  const { application, loading, error } = useApplication();

  if (error) {
    return (
      <Card className="bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Get all unique fields across all objects
  const fields = application?.objects.flatMap((object) =>
    object.fields.map((field) => ({
      ...field,
      objectName: object.name,
      objectKey: object.key,
    }))
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fields</CardTitle>
        <CardDescription>
          A list of all fields across all objects in your Knack application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[20%]">Name</TableHead>
              <TableHead className="w-[15%]">Key</TableHead>
              <TableHead className="w-[15%]">Type</TableHead>
              <TableHead className="w-[20%]">Object</TableHead>
              <TableHead>Format</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? // Loading state
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-[200px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[150px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-20 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              : fields?.map((field) => (
                  <FieldRow
                    key={`${field.objectKey}-${field.key}`}
                    field={field}
                  />
                ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

interface FieldRowProps {
  field: KnackField & { objectName: string; objectKey: string };
}

function FieldRow({ field }: FieldRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {field.name}
          {field.required && (
            <Badge variant="destructive" className="text-xs">
              Required
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
          {field.key}
        </code>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{field.type}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span>{field.objectName}</span>
          <code className="text-xs bg-muted px-1 py-0.5 rounded">
            {field.objectKey}
          </code>
        </div>
      </TableCell>
      <TableCell>
        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
          {JSON.stringify(field.format, null, 2)}
        </pre>
      </TableCell>
    </TableRow>
  );
}
