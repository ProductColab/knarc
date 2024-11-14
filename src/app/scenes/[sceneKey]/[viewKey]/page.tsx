"use client";

import { View } from "@/lib/knack/components/View";
import { useScenes } from "@/lib/knack/hooks/useScenes";
import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function ViewPage() {
  const params = useParams();
  const sceneKey = params.sceneKey as string;
  const viewKey = params.viewKey as string;
  const { scenes, loading, error } = useScenes();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-8 w-[200px] bg-muted animate-pulse rounded" />
          <div className="h-4 w-[300px] bg-muted animate-pulse rounded" />
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading View</CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const scene = scenes.find((s) => s.key === sceneKey);
  if (!scene) {
    notFound();
  }

  const view = scene.views?.find((v) => v.key === viewKey);
  if (!view) {
    notFound();
  }

  return <View view={view} scene={scene} />;
}
