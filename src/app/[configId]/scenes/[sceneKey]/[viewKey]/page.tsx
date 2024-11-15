"use client";

import { View } from "@/lib/knack/components/View";
import { useScenes } from "@/hooks/useScenes";
import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function ViewPage({
  params,
}: {
  params: { configId: string; sceneKey: string; viewKey: string };
}) {
  const { configId, sceneKey, viewKey } = params;
  const { scenes, isLoading, error } = useScenes(configId);

  if (isLoading) {
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
