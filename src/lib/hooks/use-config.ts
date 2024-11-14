import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getConfigurations,
  getActiveConfiguration,
  setActiveConfiguration,
  type KnackConfiguration,
} from "@/lib/config-store";

export function useConfig() {
  const pathname = usePathname();
  const [configs, setConfigs] = useState<KnackConfiguration[]>([]);
  const [activeConfig, setActiveConfig] = useState<KnackConfiguration | null>(
    null
  );

  const refreshConfigs = () => {
    setConfigs(getConfigurations());
    setActiveConfig(getActiveConfiguration());
  };

  // Refresh configs on mount and route changes
  useEffect(() => {
    refreshConfigs();
  }, [pathname]);

  const setActive = (configName: string) => {
    setActiveConfiguration(configName);
    refreshConfigs();
  };

  return {
    configs,
    activeConfig,
    hasConfig: configs.length > 0,
    refreshConfigs,
    setActive,
  };
}
