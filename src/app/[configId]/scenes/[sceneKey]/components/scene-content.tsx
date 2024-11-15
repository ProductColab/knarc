"use client";

import { useScenes } from "@/hooks/useScenes";
import { notFound } from "next/navigation";
import { SceneDetailsCard } from "./scene-details-card";
import { SceneViewsCard } from "./scene-views-card";
import { LoadingSkeleton } from "../../components/loading-skeleton";
import { ErrorCard } from "../../components/error-card";
import Content from "@/components/ui/Content";
import { KnackScene } from "@/lib/knack/types/scenes";

interface SceneContentProps {
  configId: string;
  sceneKey: string;
}

export function SceneContent({ configId, sceneKey }: SceneContentProps) {
  const { data: scenes, isLoading, error } = useScenes(configId);

  if (isLoading) {
    return (
      <div className="animate-in fade-in duration-500">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-in fade-in duration-500">
        <ErrorCard error={error} />
      </div>
    );
  }

  const scene = scenes?.find((s: KnackScene) => s.key === sceneKey);

  if (!scene) {
    notFound();
  }

  return (
    <Content className="space-y-4 animate-in fade-in duration-500">
      <SceneDetailsCard scene={scene} />
      <SceneViewsCard
        configId={configId}
        sceneKey={sceneKey}
        views={scene.views}
      />
    </Content>
  );
}
