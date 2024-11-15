"use client";

import { useKnack } from "@/lib/knack/context";
import { useConfig } from "@/hooks/useConfig";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export function ConfigGuard({ children }: { children: React.ReactNode }) {
  const { isInitialized } = useKnack();
  const { activeConfig } = useConfig();
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (activeConfig && params.configId !== activeConfig.id) {
      router.push(`/${activeConfig.id}`);
    }
  }, [activeConfig, params.configId, router]);

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  // If we're about to redirect, show nothing to prevent flash of content
  if (activeConfig && params.configId !== activeConfig.id) {
    return null;
  }

  return <>{children}</>;
}
