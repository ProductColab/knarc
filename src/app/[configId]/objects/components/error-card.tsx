import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface ErrorCardProps {
  error: Error;
}

export function ErrorCard({ error }: ErrorCardProps) {
  return (
    <Card className="bg-destructive/10">
      <CardHeader>
        <CardTitle className="text-destructive">
          Error Loading Objects
        </CardTitle>
        <CardDescription>{error.message}</CardDescription>
      </CardHeader>
    </Card>
  );
}
