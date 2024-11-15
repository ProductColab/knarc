"use client";

import { useParams } from "next/navigation";
import { useObjects } from "@/hooks/useObjects";
import { Objects } from "../components/Objects";
import { Suspense } from "react";
import { ErrorBoundary } from "@/lib/knack/components/ErrorBoundary";
import Content from "@/components/ui/Content";
import { LoadingSkeleton } from "./loading-skeleton";
import { ErrorCard } from "./error-card";
import { useKnack } from "@/lib/knack/context";

function ObjectsData() {
  const params = useParams();
  const configId = params.configId as string;
  const { isInitialized } = useKnack();

  console.log("🎯 Rendering objects for configId:", configId);

  const { data: objects, isLoading, error } = useObjects(configId);

  // Don't fetch until everything is initialized
  if (!isInitialized) {
    return <LoadingSkeleton />;
  }

  console.log("📊 Objects data:", {
    objects,
    isLoading,
    error,
    objectsCount: objects?.length,
  });

  if (error) {
    return <ErrorCard error={error} />;
  }

  return <Objects objects={objects || []} loading={isLoading} />;
}

export function ObjectsContent() {
  return (
    <Content>
      <ErrorBoundary fallback={(error: Error) => <ErrorCard error={error} />}>
        <Suspense fallback={<LoadingSkeleton />}>
          <ObjectsData />
        </Suspense>
      </ErrorBoundary>
    </Content>
  );
}
