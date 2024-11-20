"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useActiveConfig } from "../config-provider";

interface ConfigOption {
  id: number;
  applicationId: string;
  name?: string;
}

interface SwitcherContentProps {
  configs: ConfigOption[];
  activeConfigId?: number;
  onSelect: (configId: number) => void;
}

function SwitcherContent({
  configs,
  activeConfigId,
  onSelect,
}: SwitcherContentProps) {
  const activeConfig = configs.find((c) => c.id === activeConfigId);
  const activeLabel = activeConfig
    ? activeConfig.name || activeConfig.applicationId
    : "Select config";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-[200px] justify-between"
        >
          {activeLabel}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]">
        {configs.map((config) => (
          <DropdownMenuItem
            key={config.id}
            onSelect={() => onSelect(config.id)}
            className={cn(
              "justify-between",
              activeConfigId === config.id && "font-medium"
            )}
          >
            {config.name || config.applicationId}
            {activeConfigId === config.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ConfigSwitcher() {
  const {
    config: activeConfig,
    availableConfigs,
    isLoading,
  } = useActiveConfig();
  const router = useRouter();

  if (isLoading) {
    return (
      <Button
        variant="outline"
        className="w-[200px] justify-between animate-pulse bg-gray-200 dark:bg-gray-800"
        disabled
      >
        <span className="invisible">Loading...</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    );
  }

  const mappedConfigs = availableConfigs.map((config) => ({
    id: config.id!,
    applicationId: config.config.applicationId,
    name: config.applicationInfo?.name,
  }));

  return (
    <SwitcherContent
      configs={mappedConfigs}
      activeConfigId={activeConfig?.id}
      onSelect={(configId) => router.push(`/${configId}`)}
    />
  );
}
