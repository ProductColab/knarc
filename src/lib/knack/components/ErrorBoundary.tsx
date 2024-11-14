"use client";

import { useEffect, type ReactNode } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ErrorBoundary({ children, fallback }: Props) {
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error("Error caught by boundary:", error);
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  return (
    <ErrorBoundaryInternal fallback={fallback}>
      {children}
    </ErrorBoundaryInternal>
  );
}

function ErrorBoundaryInternal({
  children,
  fallback = (
    <Card className="bg-destructive/10">
      <CardHeader>
        <CardTitle className="text-destructive">Error</CardTitle>
        <CardDescription>Something went wrong</CardDescription>
      </CardHeader>
    </Card>
  ),
}: Props) {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error("Error caught by boundary:", error);
    return <>{fallback}</>;
  }
}
