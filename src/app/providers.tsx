"use client";

import { KnackProvider } from "@/lib/knack/components/KnackProvider";
import { SidebarProvider } from "@/components/ui/sidebar";
// Default configuration from environment variables
const defaultConfig = {
  applicationId: process.env.NEXT_PUBLIC_KNACK_APPLICATION_ID!,
  apiKey: process.env.NEXT_PUBLIC_KNACK_API_KEY!,
  apiHost: process.env.NEXT_PUBLIC_KNACK_API_HOST!,
  apiVersion: process.env.NEXT_PUBLIC_KNACK_API_VERSION ?? "v1",
  apiDomain: process.env.NEXT_PUBLIC_KNACK_API_DOMAIN,
  accountSlug: process.env.NEXT_PUBLIC_KNACK_ACCOUNT_SLUG,
  appSlug: process.env.NEXT_PUBLIC_KNACK_APP_SLUG,
  builderUrl: process.env.NEXT_PUBLIC_KNACK_BUILDER_URL,
  appUrl: process.env.NEXT_PUBLIC_KNACK_APP_URL,
};

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <KnackProvider config={defaultConfig}>
      <SidebarProvider>{children}</SidebarProvider>
    </KnackProvider>
  );
}
