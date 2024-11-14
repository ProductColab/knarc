import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container py-8 max-w-5xl">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-[100px]" />
          </div>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
