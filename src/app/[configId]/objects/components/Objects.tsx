import { ErrorBoundary } from "@/lib/knack/components/ErrorBoundary";
import type { KnackObject } from "@/lib/knack/types/application";
import { ObjectsTable } from "./objects-table";
import { ErrorCard } from "./error-card";

interface ObjectsProps {
  objects?: KnackObject[];
  loading?: boolean;
}

export function Objects({ objects, loading }: ObjectsProps) {
  return (
    <ErrorBoundary fallback={(error) => <ErrorCard error={error} />}>
      <ObjectsTable data={objects ?? []} loading={loading} />
    </ErrorBoundary>
  );
}
