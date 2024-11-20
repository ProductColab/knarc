"use client";

import { ConfigForm } from "./ConfigForm";
import { useActiveConfig } from "../config-provider";
import { ConfigUpdate } from "../types";
import { Loading } from "@/components/ui/loading";
import { useConfig } from "../hooks/useConfig";

export function ConfigContent() {
  const { config, isLoading, isError } = useActiveConfig();
  const { updateConfig } = useConfig(config?.id);

  if (isLoading) {
    return <Loading message="Loading configuration..." />;
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Configuration not found</p>
      </div>
    );
  }

  const defaultConfig: ConfigUpdate = {
    config: {
      applicationId: "",
      apiKey: "",
      apiDomain: "api",
      apiHost: "knack.com",
      apiVersion: "v1",
    },
  };

  return (
    <ConfigForm config={config || defaultConfig} onSubmit={updateConfig} />
  );
}
