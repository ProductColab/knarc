"use client";
import { useRouter } from "next/navigation";
import { ConfigForm } from "./ConfigForm";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfig } from "../hooks/useConfig";
import { ConfigWizard } from "./ConfigWizard";
import { useAvailableConfigs } from "../hooks/useAvailableConfigs";
import { ConfigId, Config, ConfigUpdate } from "../types";

interface ConfigContentProps {
  configId: ConfigId | null;
  onConfigured?: (id: number) => void;
}

export function ConfigContent({ configId, onConfigured }: ConfigContentProps) {
  const router = useRouter();
  const { config, error, isLoading, updateConfig } = useConfig(configId);
  const { data: availableConfigs } = useAvailableConfigs();

  if (isLoading) {
    return <Skeleton className="w-full h-[500px]" />;
  }

  // If we're on the main page and have configs, redirect to the first one
  if (!configId && availableConfigs && availableConfigs.length > 0) {
    router.push(`/${availableConfigs[0].id}`);
    return null;
  }

  // Show wizard only on main page when no configs exist
  if (!configId && availableConfigs?.length === 0) {
    return (
      <ConfigWizard
        onComplete={async (data: ConfigUpdate) => {
          const newConfigId = await updateConfig(data);
          if (onConfigured) {
            onConfigured(newConfigId);
          } else {
            router.push(`/${newConfigId}`);
          }
          return newConfigId;
        }}
      />
    );
  }

  if (!config) {
    return null;
  }

  return (
    <ErrorBoundary>
      <ConfigEditor
        config={config}
        error={error}
        configId={configId}
        updateConfig={updateConfig}
      />
    </ErrorBoundary>
  );
}

interface ConfigEditorProps {
  config: Config;
  error: Error | null;
  configId: ConfigId | null;
  updateConfig: (data: ConfigUpdate) => Promise<number>;
}

function ConfigEditor({
  config,
  error,
  configId,
  updateConfig,
}: ConfigEditorProps) {
  if (error) {
    throw error;
  }

  if (!config) {
    return (
      <div className="text-sm text-muted-foreground">
        No configuration found for ID: {configId}
      </div>
    );
  }

  const handleSubmit = async (data: ConfigUpdate) => {
    await updateConfig(data);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Update Configuration</h1>
      <ConfigForm config={config} onSubmit={handleSubmit} />
    </div>
  );
}
