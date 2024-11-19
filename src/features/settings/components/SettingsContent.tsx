"use client";
import { useRouter } from "next/navigation";
import { SettingsForm } from "./SettingsForm";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettingsData } from "../hooks/useSettingsData";
import { SettingsWizard } from "./SettingsWizard";
import { useAvailableSettings } from "../hooks/useAvailableSettings";
import {
  SettingsApplicationId,
  Settings as SettingsType,
  SettingsUpdate,
  KnackConfig,
} from "../types";

interface SettingsContentProps {
  applicationId: SettingsApplicationId | null;
  onConfigured?: (id: string) => void;
}

export function SettingsContent({
  applicationId,
  onConfigured,
}: SettingsContentProps) {
  const router = useRouter();
  const { settings, error, isLoading, updateSettings } =
    useSettingsData(applicationId);
  const { data: availableSettings } = useAvailableSettings();

  if (isLoading) {
    return <Skeleton className="w-full h-[500px]" />;
  }

  // If we're on the main page and have settings, redirect to the first one
  if (!applicationId && availableSettings && availableSettings.length > 0) {
    router.push(`/${availableSettings[0]}`);
    return null;
  }

  // Show wizard only on main page when no settings exist
  if (!applicationId && availableSettings?.length === 0) {
    return (
      <SettingsWizard
        onComplete={async (data: SettingsUpdate) => {
          await updateSettings(data);
          if (onConfigured) {
            onConfigured(data.id);
          } else {
            router.push(`/${data.id}`);
          }
        }}
      />
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <ErrorBoundary>
      <Settings
        settings={settings}
        error={error}
        applicationId={applicationId}
        updateSettings={updateSettings}
      />
    </ErrorBoundary>
  );
}

interface SettingsProps {
  settings: SettingsType | null;
  error: Error | null;
  applicationId: SettingsApplicationId | null;
  updateSettings: (data: SettingsUpdate) => Promise<void>;
}

function Settings({
  settings,
  error,
  applicationId,
  updateSettings,
}: SettingsProps) {
  if (error) {
    throw error;
  }

  if (!settings) {
    return (
      <div className="text-sm text-muted-foreground">
        No settings found for application ID: {applicationId}
      </div>
    );
  }

  const handleSubmit = async (config: KnackConfig) => {
    try {
      const settingsUpdate: SettingsUpdate = {
        id: settings.id,
        config,
      };

      await updateSettings(settingsUpdate);
      return { data: config, error: null };
    } catch (err) {
      return {
        data: null,
        error:
          err instanceof Error ? err : new Error("Failed to update settings"),
      };
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Update Settings</h1>
      <SettingsForm settings={settings.config} onSubmit={handleSubmit} />
    </div>
  );
}
