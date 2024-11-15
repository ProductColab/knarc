"use client";

import { useParams } from "next/navigation";
import { useScenes } from "@/hooks/useScenes";
import { Scenes } from "../components/Scenes";
import { Suspense } from "react";
import { ErrorBoundary } from "@/lib/knack/components/ErrorBoundary";
import { LoadingSkeleton } from "./loading-skeleton";
import { ErrorCard } from "./error-card";
import Content from "@/components/ui/Content";
import { useKnack } from "@/lib/knack/context";

function ScenesData() {
  const params = useParams();
  const configId = params.configId as string;
  const { isInitialized } = useKnack();

  console.log("🎯 Rendering scenes for configId:", configId);

  const { data: scenes, isLoading, error } = useScenes(configId);

  // Don't fetch until everything is initialized
  if (!isInitialized) {
    return <LoadingSkeleton />;
  }

  console.log("📊 Scenes data:", {
    scenes,
    isLoading,
    error,
    scenesCount: scenes?.length,
  });

  if (error) {
    return <ErrorCard error={error} />;
  }

  return <Scenes scenes={scenes || []} loading={isLoading} />;
}

export function ScenesContent() {
  return (
    <Content>
      <ErrorBoundary fallback={(error: Error) => <ErrorCard error={error} />}>
        <Suspense fallback={<LoadingSkeleton />}>
          <ScenesData />
        </Suspense>
      </ErrorBoundary>
    </Content>
  );
}
