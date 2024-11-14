"use client";

import { Scenes } from "@/lib/knack/components/Scenes";
import { useScenes } from "@/lib/knack/hooks/useScenes";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/lib/knack/components/ErrorBoundary";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

function ErrorFallback() {
  return (
    <Card className="bg-destructive/10">
      <CardHeader>
        <CardTitle className="text-destructive">Error</CardTitle>
        <CardDescription>Failed to load scenes</CardDescription>
      </CardHeader>
    </Card>
  );
}

function ScenesContent() {
  const { scenes } = useScenes();
  return <Scenes scenes={scenes} />;
}

export default function ScenesPage() {
  return (
    <div className="container py-8">
      <ErrorBoundary fallback={<ErrorFallback />}>
        <Suspense fallback={<LoadingSkeleton />}>
          <ScenesContent />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
