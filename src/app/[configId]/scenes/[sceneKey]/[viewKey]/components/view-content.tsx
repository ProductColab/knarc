"use client";

import { View } from "@/lib/knack/components/View";
import { useScenes } from "@/hooks/useScenes";
import { notFound } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { KnackScene, KnackView } from "@/lib/knack/types";
import Content from "@/components/ui/Content";

interface ViewContentProps {
  configId: string;
  sceneKey: string;
  viewKey: string;
}

export function ViewContent({ configId, sceneKey, viewKey }: ViewContentProps) {
  const { data: scenes, isLoading, error } = useScenes(configId);

  if (isLoading) {
    return (
      <Card className="glass-card border-glow">
        <CardHeader>
          <CardTitle className="space-y-2">
            <div className="h-8 w-[200px] bg-muted animate-pulse rounded" />
          </CardTitle>
          <CardDescription>
            <div className="h-4 w-[300px] bg-muted animate-pulse rounded" />
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-card error-glow">
        <CardHeader>
          <CardTitle className="text-glow-sm text-destructive">
            Error Loading View
          </CardTitle>
          <CardDescription className="text-destructive/80">
            {error.message}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!scenes) {
    return null;
  }

  const scene = scenes.find((s: KnackScene) => s.key === sceneKey);
  if (!scene) {
    console.log("Scene not found:", {
      availableScenes: scenes.map((s: KnackScene) => s.key),
      lookingFor: sceneKey,
    });
    notFound();
  }

  const view = scene.views?.find((v: KnackView) => v.key === viewKey);
  if (!view) {
    console.log("View not found:", {
      availableViews: scene.views?.map((v: KnackView) => v.key),
      lookingFor: viewKey,
    });
    notFound();
  }

  return (
    <Content className="space-y-4">
      <Card className="glass-card border-glow">
        <CardHeader>
          <CardTitle className="text-glow-white text-glow-sm">
            {view.name}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {view.title || "No title set"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="gradient-glow">
            <View view={view} scene={scene} />
          </div>
        </CardContent>
      </Card>
    </Content>
  );
}
