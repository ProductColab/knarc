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
import type { KnackObject } from "../types";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { cn } from "@/lib/utils";

export function Objects() {
  return (
    <ErrorBoundary>
      <ObjectsContent />
    </ErrorBoundary>
  );
}

function ObjectsContent() {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Objects</CardTitle>
        <CardDescription>
          A list of all objects in your Knack application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Fields</TableHead>
              <TableHead>Connections</TableHead>
              <TableHead>Identifier</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? // Loading state
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-[250px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[50px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[80px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[150px]" />
                    </TableCell>
                  </TableRow>
                ))
              : application?.objects.map((object) => (
                  <ObjectRow key={object._id} object={object} />
                ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

interface ObjectRowProps {
  object: KnackObject;
}

function ObjectRow({ object }: ObjectRowProps) {
  const totalConnections =
    object.connections.inbound.length + object.connections.outbound.length;

  // Find the identifier field
  const identifierField = object.fields.find(
    (field) => field.key === object.identifier
  );

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">{object.name}</div>
      </TableCell>
      <TableCell>
        <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
          {object.key}
        </code>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{object.fields.length}</Badge>
      </TableCell>
      <TableCell>
        {totalConnections > 0 ? (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1.5">
              <ArrowDownToLine
                className={cn(
                  "h-3 w-3",
                  object.connections.inbound.length === 0 &&
                    "text-muted-foreground"
                )}
              />
              {object.connections.inbound.length}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1.5">
              <ArrowUpFromLine
                className={cn(
                  "h-3 w-3",
                  object.connections.outbound.length === 0 &&
                    "text-muted-foreground"
                )}
              />
              {object.connections.outbound.length}
            </Badge>
          </div>
        ) : (
          <Badge variant="outline">None</Badge>
        )}
      </TableCell>
      <TableCell>
        {identifierField ? (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {identifierField.name}
            </span>
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              {identifierField.key}
            </code>
          </div>
        ) : (
          <span className="text-muted-foreground">No identifier</span>
        )}
      </TableCell>
    </TableRow>
  );
}
