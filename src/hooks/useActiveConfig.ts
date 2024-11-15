import { useConfig } from "./useConfig";
import { useRouter } from "next/navigation";
import { useToast } from "./use-toast";
import { useCallback, useEffect, useRef } from "react";

export function useActiveConfig(configId?: string) {
  const { configs, setActiveConfig } = useConfig();
  const router = useRouter();
  const { toast } = useToast();
  const hasAttemptedNavigation = useRef(false);

  const activateConfig = useCallback(
    async (id: string) => {
      if (!id || hasAttemptedNavigation.current) return;

      const config = configs.find((c) => c.id === id);
      if (!config) {
        hasAttemptedNavigation.current = true;
        toast({
          title: "Error",
          description: "Configuration not found",
          variant: "destructive",
        });
        router.push("/config");
        return;
      }

      if (!config.isActive) {
        try {
          await setActiveConfig(id);
        } catch (error) {
          console.error("Failed to set active config:", error);
          hasAttemptedNavigation.current = true;
          toast({
            title: "Error",
            description: "Failed to activate configuration",
            variant: "destructive",
          });
          router.push("/config");
        }
      }
    },
    [configs, router, setActiveConfig, toast]
  );

  // Reset the navigation flag when configId changes
  useEffect(() => {
    hasAttemptedNavigation.current = false;
  }, [configId]);

  return { activateConfig };
} 