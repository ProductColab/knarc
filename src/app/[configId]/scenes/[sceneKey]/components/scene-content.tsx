"use client";

import { useScenes } from "@/hooks/useScenes";
import { notFound } from "next/navigation";
import { SceneDetailsCard } from "./scene-details-card";
import { SceneViewsCard } from "./scene-views-card";
import { LoadingSkeleton } from "../../components/loading-skeleton";
import { ErrorCard } from "../../components/error-card";
import Content from "@/components/ui/Content";

interface SceneContentProps {
  configId: string;
  sceneKey: string;
}

export function SceneContent({ configId, sceneKey }: SceneContentProps) {
  const { scenes, isLoading, error } = useScenes(configId);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorCard error={error} />;
  }

  const scene = scenes.find((s) => s.key === sceneKey);

  if (!scene) {
    notFound();
  }

  return (
    <Content className="space-y-4">
      <SceneDetailsCard scene={scene} />
      <SceneViewsCard
        configId={configId}
        sceneKey={sceneKey}
        views={scene.views}
      />
    </Content>
  );
}
