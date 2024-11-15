import { Card, CardHeader } from "@/components/ui/card";

export function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-8 w-[200px] bg-muted animate-pulse rounded" />
        <div className="h-4 w-[300px] bg-muted animate-pulse rounded" />
      </CardHeader>
    </Card>
  );
}
