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
import { useAvailableConfigs } from "../hooks/useAvailableConfigs";
import { useRouter } from "next/navigation";

interface ConfigSwitcherProps {
  activeConfigId?: number;
}

interface SwitcherContentProps {
  configs: Array<{ id: number; applicationId: string }>;
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
    ? activeConfig.applicationId
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
            {config.applicationId}
            {activeConfigId === config.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ConfigSwitcher({ activeConfigId }: ConfigSwitcherProps) {
  const { data: configs = [], isLoading } = useAvailableConfigs();
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

  return (
    <SwitcherContent
      configs={configs}
      activeConfigId={activeConfigId}
      onSelect={(configId) => router.push(`/${configId}`)}
    />
  );
}
