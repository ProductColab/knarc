"use client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { ReactNode, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Loading } from "@/components/ui/loading";

export const DuckDB = dynamic<{ children: ReactNode }>(
  () => import("@/lib/duckdb/provider").then((mod) => mod.DuckDBProvider),
  {
    ssr: false,
  }
);

export const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          <Suspense fallback={<Loading message="Loading application..." />}>
            <DuckDB>{children}</DuckDB>
          </Suspense>
        </SidebarProvider>
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
