import { useApplication } from "../hooks/useApplication";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function Application() {
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

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </CardHeader>
        </Card>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!application) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {application.name}
          </CardTitle>
          <CardDescription>
            Application ID: <code>{application.id}</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Total Scenes
              </dt>
              <dd className="text-2xl font-bold">
                {application.scenes.length}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Total Objects
              </dt>
              <dd className="text-2xl font-bold">
                {application.objects.length}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
