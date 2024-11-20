"use client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ui/error-boundary";

const DuckDBProvider = dynamic(() => import("@/lib/duckdb/duckdb-provider"), {
  // DuckDB is too heavy for server-side rendering :(
  ssr: false,
});

const ConfigProvider = dynamic(
  () => import("@/features/config/config-provider"),
  {
    ssr: true,
  }
);

export const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          <DuckDBProvider>
            <ConfigProvider>{children}</ConfigProvider>
          </DuckDBProvider>
        </SidebarProvider>
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
