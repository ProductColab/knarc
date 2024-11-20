"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActiveConfig } from "../config-provider";

interface ConfigOption {
  id: number;
  applicationId: string;
  name?: string;
}

function ConfigList({
  configs,
  activeConfigId,
  setOpen,
  onSelect,
}: {
  configs: ConfigOption[];
  activeConfigId?: number;
  setOpen: (open: boolean) => void;
  onSelect: (configId: number) => void;
}) {
  return (
    <Command>
      <CommandInput placeholder="Search configs..." />
      <CommandList>
        <CommandEmpty>No configs found.</CommandEmpty>
        <CommandGroup>
          {configs.map((config) => (
            <CommandItem
              key={config.id}
              value={config.name || config.applicationId}
              onSelect={() => {
                onSelect(config.id);
                setOpen(false);
              }}
            >
              <span>{config.name || config.applicationId}</span>
              {activeConfigId === config.id && (
                <Check className="ml-auto h-4 w-4" />
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export function ConfigSwitcher() {
  const [open, setOpen] = React.useState(false);
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
        className="justify-between animate-pulse bg-gray-200 dark:bg-gray-800"
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

  const activeLabel = activeConfig
    ? activeConfig.applicationInfo?.name || activeConfig.config.applicationId
    : "Select config";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {activeLabel}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <ConfigList
          configs={mappedConfigs}
          activeConfigId={activeConfig?.id}
          setOpen={setOpen}
          onSelect={(configId) => router.push(`/${configId}`)}
        />
      </PopoverContent>
    </Popover>
  );
}
