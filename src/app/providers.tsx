"use client";

import { KnackProvider } from "@/components/KnackProvider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { QueryClientProvider } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <KnackProvider>
        <SidebarProvider>{children}</SidebarProvider>
      </KnackProvider>
    </QueryClientProvider>
  );
}
