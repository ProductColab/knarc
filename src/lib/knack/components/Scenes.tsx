import type { KnackScene } from "../types";
import { ScenesTable } from "./scenes-table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface ScenesProps {
  scenes: KnackScene[];
  error?: Error;
}

export function Scenes({ scenes, error }: ScenesProps) {
  if (error) {
    return (
      <Card className="bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive">
            Error Loading Scenes
          </CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return <ScenesTable data={scenes} />;
}
