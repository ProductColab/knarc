"use client";

import { useKnack } from "@/lib/knack/context";
import { useConfig } from "@/hooks/useConfig";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

export function ConfigGuard({ children }: { children: React.ReactNode }) {
  const { isInitialized } = useKnack();
  const { activeConfig } = useConfig();
  const params = useParams();
  const router = useRouter();

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  // Redirect if the configId in the URL doesn't match the active config
  if (activeConfig && params.configId !== activeConfig.id) {
    router.push(`/${activeConfig.id}`);
    return null;
  }

  return <>{children}</>;
}
