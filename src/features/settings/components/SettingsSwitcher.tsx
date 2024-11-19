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
import { useAvailableSettings } from "../hooks/useAvailableSettings";
import { useRouter } from "next/navigation";

interface SettingsSwitcherProps {
  activeSetting?: string;
}

interface SwitcherContentProps {
  settings: string[];
  activeSetting?: string;
  onSelect: (setting: string) => void;
}

function SwitcherContent({
  settings,
  activeSetting,
  onSelect,
}: SwitcherContentProps) {
  const activeLabel = activeSetting
    ? settings.find((s: string) => s === activeSetting) || "Select config"
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
        {settings.map((setting: string) => (
          <DropdownMenuItem
            key={setting}
            onSelect={() => onSelect(setting)}
            className={cn(
              "justify-between",
              activeSetting === setting && "font-medium"
            )}
          >
            {setting}
            {activeSetting === setting && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SettingsSwitcher({ activeSetting }: SettingsSwitcherProps) {
  const { data: settings = [], isLoading } = useAvailableSettings();
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
      settings={settings}
      activeSetting={activeSetting}
      onSelect={(setting) => router.push(`/${setting}`)}
    />
  );
}
