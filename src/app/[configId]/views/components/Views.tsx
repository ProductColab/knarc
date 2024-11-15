import { ViewsTable } from "./views-table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { EnhancedKnackView } from "@/hooks/useViews";

interface ViewsProps {
  views?: EnhancedKnackView[];
  error?: Error;
  loading?: boolean;
}

export function Views({ views, error, loading }: ViewsProps) {
  if (error) {
    return (
      <Card className="bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive">
            Error Loading Views
          </CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return <ViewsTable data={views ?? []} loading={loading} />;
}
